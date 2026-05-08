import * as cheerio from 'cheerio';
import fetch from 'node-fetch';

const BASE_URL = 'https://www.fipav.tn.it';
const RESULTS_URL = `${BASE_URL}/risultati-classifiche.aspx?PId=110`;

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

export async function fetchSeasons() {
  const response = await fetch(RESULTS_URL, {
    headers: { 'User-Agent': USER_AGENT }
  });
  const html = await response.text();
  const $ = cheerio.load(html);

  const seasons = [];
  $('select[name="StId"] option').each((i, el) => {
    seasons.push({
      id: $(el).attr('value'),
      name: $(el).text().trim()
    });
  });

  return seasons;
}

export async function fetchCompetitionsBySeason(seasonId) {
  const url = `${RESULTS_URL}&SId=${seasonId}`;
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT }
  });
  const html = await response.text();
  const $ = cheerio.load(html);

  const competitions = [];
  $('select[name="CId"] optgroup').each((i, group) => {
    const groupLabel = $(group).attr('label');
    $(group).find('option').each((j, el) => {
      competitions.push({
        id: $(el).attr('value'),
        seasonId,
        name: $(el).text().trim(),
        category: groupLabel
      });
    });
  });

  return competitions;
}

export async function fetchTeamsByCompetition(competitionId, seasonId = '2278') {
  // Usually teams are listed in the standings table
  const url = `${RESULTS_URL}&SId=${seasonId}&CId=${competitionId}`;
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT }
  });
  const html = await response.text();
  const $ = cheerio.load(html);

  const teams = [];
  $('.tbl-classifica tr').each((i, el) => {
    const nameCell = $(el).find('td').eq(1);
    if (nameCell.length) {
      // Remove the image and trim
      nameCell.find('img').remove();
      const name = nameCell.text().trim();
      if (name) {
        teams.push({
          id: `${competitionId}-team-${i}`, // Synthetic ID if not found elsewhere
          name: name
        });
      }
    }
  });

  return teams;
}

export async function fetchMatchesByCompetition(competitionId, seasonId = '2278') {
  const url = `${RESULTS_URL}&SId=${seasonId}&CId=${competitionId}`;
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT }
  });
  const html = await response.text();
  const $ = cheerio.load(html);

  const matches = [];
  // The first table is usually results
  $('.tbl').first().find('tr').each((i, el) => {
    const cells = $(el).find('td');
    if (cells.length >= 6) {
      const matchCode = cells.eq(0).text().trim();
      const dateStr = cells.eq(2).text().trim();

      const homeTeamCell = cells.eq(3);
      homeTeamCell.find('img').remove();
      const homeTeam = homeTeamCell.text().trim();

      const awayTeamCell = cells.eq(4);
      awayTeamCell.find('img').remove();
      const awayTeam = awayTeamCell.text().trim();

      const result = cells.eq(5).text().trim();

      matches.push({
        id: matchCode || `m-${i}`,
        competitionId,
        homeTeam,
        awayTeam,
        date: dateStr, // Format: 13/01/24 16:30
        status: result.includes('-') && !result.includes('?') ? 'completed' : 'scheduled',
        result: result === '- - -' ? null : result
      });
    }
  });

  return matches;
}

export async function fetchStandingsByCompetition(competitionId, seasonId = '2278') {
  const url = `${RESULTS_URL}&SId=${seasonId}&CId=${competitionId}`;
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT }
  });
  const html = await response.text();
  const $ = cheerio.load(html);

  const standings = [];
  $('.tbl-classifica tr').each((i, el) => {
    const cells = $(el).find('td');
    if (cells.length >= 3) {
      const rank = cells.eq(0).text().trim();

      const nameCell = cells.eq(1);
      nameCell.find('img').remove();
      const teamName = nameCell.text().trim();

      const points = cells.eq(2).text().trim();
      const played = cells.eq(3).text().trim();

      if (teamName) {
        standings.push({
          competitionId,
          rank: parseInt(rank),
          teamName,
          points: parseInt(points),
          played: parseInt(played)
        });
      }
    }
  });

  return standings;
}
