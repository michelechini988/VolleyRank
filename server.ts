import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";

// Services
import { fetchSeasons, fetchCompetitionsBySeason, fetchTeamsByCompetition, fetchMatchesByCompetition, fetchStandingsByCompetition } from "./src/services/official_competition_sync/provider_fipav_trentino.js";
import { suggestTeamLinks, confirmTeamLink } from "./src/services/official_competition_sync/team_linking_service.js";
import { addCompetitionLink, removeCompetitionLink, getCompetitionLinks } from "./src/services/official_competition_sync/competition_membership_service.js";
import { runFullSync, runIncrementalSync } from "./src/services/official_competition_sync/sync_scheduler.js";
import { supabaseAdmin } from "./src/services/official_competition_sync/official_catalog_service.js";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // GET /api/official/seasons
  app.get("/api/official/seasons", async (req, res) => {
    try {
      const seasons = await fetchSeasons();
      res.json(seasons);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch seasons" });
    }
  });

  // GET /api/official/competitions?season_id=...
  app.get("/api/official/competitions", async (req, res) => {
    try {
      const seasonId = req.query.season_id as string;
      if (!seasonId) {
        return res.status(400).json({ error: "season_id is required" });
      }
      const competitions = await fetchCompetitionsBySeason(seasonId);
      res.json(competitions);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch competitions" });
    }
  });

  // GET /api/official/competitions/{id}/teams
  app.get("/api/official/competitions/:id/teams", async (req, res) => {
    try {
      const competitionId = req.params.id;
      const teams = await fetchTeamsByCompetition(competitionId);
      res.json(teams);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch teams" });
    }
  });

  // POST /api/teams/{appTeamId}/official-link/suggest
  app.post("/api/teams/:appTeamId/official-link/suggest", async (req, res) => {
    try {
      const { appTeamId } = req.params;
      const { seasonId } = req.body;
      const suggestions = await suggestTeamLinks(appTeamId, seasonId);
      res.json({ suggestions });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to suggest links" });
    }
  });

  // POST /api/teams/{appTeamId}/official-link/confirm
  app.post("/api/teams/:appTeamId/official-link/confirm", async (req, res) => {
    try {
      const { appTeamId } = req.params;
      const { officialTeamId, seasonId } = req.body;
      await confirmTeamLink(appTeamId, officialTeamId, seasonId);
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to confirm link" });
    }
  });

  // POST /api/teams/{appTeamId}/competitions
  app.post("/api/teams/:appTeamId/competitions", async (req, res) => {
    try {
      const { appTeamId } = req.params;
      const { officialTeamId, officialCompetitionId, officialSeasonId, isPrimary } = req.body;
      await addCompetitionLink(appTeamId, officialTeamId, officialCompetitionId, officialSeasonId, isPrimary);
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to add competition link" });
    }
  });

  // DELETE /api/teams/{appTeamId}/competitions/{linkId}
  app.delete("/api/teams/:appTeamId/competitions/:linkId", async (req, res) => {
    try {
      const { linkId } = req.params;
      await removeCompetitionLink(linkId);
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to remove competition link" });
    }
  });

  // GET /api/teams/{appTeamId}/competitions
  app.get("/api/teams/:appTeamId/competitions", async (req, res) => {
    try {
      const { appTeamId } = req.params;
      const links = await getCompetitionLinks(appTeamId);
      res.json(links);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch competition links" });
    }
  });

  // POST /api/teams/{appTeamId}/sync
  app.post("/api/teams/:appTeamId/sync", async (req, res) => {
    try {
      const { appTeamId } = req.params;
      const { type } = req.body; // 'full' or 'incremental'
      
      if (type === 'full') {
        await runFullSync(appTeamId);
      } else {
        await runIncrementalSync(appTeamId);
      }
      
      res.json({ success: true, status: "completed" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Sync failed" });
    }
  });

  // GET /api/teams/{appTeamId}/matches
  app.get("/api/teams/:appTeamId/matches", async (req, res) => {
    try {
      const { appTeamId } = req.params;
      const { competition_id } = req.query;
      
      let query = supabaseAdmin
        .from('scouting_matches')
        .select('*')
        .eq('app_team_id', appTeamId);
        
      if (competition_id) {
        query = query.eq('official_competition_id', competition_id);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      res.json(data);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch matches" });
    }
  });

  // GET /api/teams/{appTeamId}/standings
  app.get("/api/teams/:appTeamId/standings", async (req, res) => {
    try {
      const { appTeamId } = req.params;
      
      // Get linked competitions
      const { data: links } = await supabaseAdmin
        .from('team_competition_links')
        .select('official_competition_id, official_season_id')
        .eq('app_team_id', appTeamId);
        
      if (!links || links.length === 0) {
        return res.json([]);
      }
      
      const compIds = links.map(l => l.official_competition_id);
      
      // Get latest standings for those competitions
      const { data, error } = await supabaseAdmin
        .from('official_standing_snapshots')
        .select('*')
        .in('official_competition_id', compIds)
        .order('snapshot_at', { ascending: false });
        
      if (error) throw error;
      res.json(data);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch standings" });
    }
  });

  // GET /api/teams/{appTeamId}/sync/conflicts
  app.get("/api/teams/:appTeamId/sync/conflicts", async (req, res) => {
    try {
      const { appTeamId } = req.params;
      
      // Get matches for this team
      const { data: matches } = await supabaseAdmin
        .from('scouting_matches')
        .select('id')
        .eq('app_team_id', appTeamId);
        
      if (!matches || matches.length === 0) return res.json([]);
      
      const matchIds = matches.map(m => m.id);
      
      const { data, error } = await supabaseAdmin
        .from('match_sync_resolution')
        .select('*')
        .in('scouting_match_id', matchIds)
        .eq('resolution_status', 'conflict');
        
      if (error) throw error;
      res.json(data);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch conflicts" });
    }
  });

  // POST /api/teams/{appTeamId}/sync/conflicts/{conflictId}/resolve
  app.post("/api/teams/:appTeamId/sync/conflicts/:conflictId/resolve", async (req, res) => {
    try {
      const { conflictId } = req.params;
      const { resolution_status, notes } = req.body;
      
      const { error } = await supabaseAdmin
        .from('match_sync_resolution')
        .update({
          resolution_status,
          notes,
          resolved_at: new Date().toISOString()
        })
        .eq('id', conflictId);
        
      if (error) throw error;
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to resolve conflict" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
