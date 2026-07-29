import * as XLSX from 'xlsx';
import { Player, DraftSettings } from '../types';
import { getFormattedPick, calculateVORP, getAdjustedProjection } from './calculations';

export function downloadDraftExcel(players: Player[], settings: DraftSettings) {
  const wb = XLSX.utils.book_new();

  // 1. Master Draft Board Sheet
  const masterData = players.map((p) => {
    const pickInfo = getFormattedPick(p.ovrRank, settings.leagueSize);
    const vorp = calculateVORP(p, players, settings.scoringFormat, settings.leagueSize);
    const proj = getAdjustedProjection(p, settings.scoringFormat);

    return {
      'Overall Rank': p.ovrRank,
      'Pick (Rd X.YY)': pickInfo.formattedString,
      'Pos Rank': p.posRank,
      'Name': p.name,
      'Position': p.pos,
      'NFL Team': p.team,
      'Bye Week': p.bye,
      'Tier': p.tier,
      'Status': p.status,
      'Proj Pts': proj,
      'VORP': vorp,
      'Target Share %': p.targetShare ? `${(p.targetShare * 100).toFixed(1)}%` : '-',
      'RZ Touches': p.rzTouches || '-',
      'Air Yards %': p.airYards ? `${(p.airYards * 100).toFixed(1)}%` : '-',
      'Ballers Profile / Upside': p.profile,
    };
  });

  const wsMaster = XLSX.utils.json_to_sheet(masterData);

  // Set column widths
  wsMaster['!cols'] = [
    { wch: 12 }, // Ovr Rank
    { wch: 14 }, // Pick
    { wch: 10 }, // Pos Rank
    { wch: 22 }, // Name
    { wch: 10 }, // Position
    { wch: 10 }, // NFL Team
    { wch: 10 }, // Bye
    { wch: 30 }, // Tier
    { wch: 20 }, // Status
    { wch: 10 }, // Proj Pts
    { wch: 10 }, // VORP
    { wch: 14 }, // Target Share
    { wch: 12 }, // RZ Touches
    { wch: 12 }, // Air Yards
    { wch: 60 }, // Profile
  ];

  XLSX.utils.book_append_sheet(wb, wsMaster, 'Master Draft Board');

  // 2. Mein Team Sheet
  const myTeamPlayers = players.filter((p) => p.status === 'Mein Team');
  const myTeamData = myTeamPlayers.map((p) => {
    const pickInfo = getFormattedPick(p.ovrRank, settings.leagueSize);
    const proj = getAdjustedProjection(p, settings.scoringFormat);
    return {
      'Draft Overall Rank': p.ovrRank,
      'Draft Pick': pickInfo.formattedString,
      'Pos Rank': p.posRank,
      'Name': p.name,
      'Position': p.pos,
      'NFL Team': p.team,
      'Bye Week': p.bye,
      'Tier': p.tier,
      'Projektion': proj,
      'Fantasy Footballers Notes': p.profile,
    };
  });
  const wsMyTeam = XLSX.utils.json_to_sheet(myTeamData.length > 0 ? myTeamData : [{ Info: 'Noch keine Spieler gedraftet' }]);
  XLSX.utils.book_append_sheet(wb, wsMyTeam, 'Mein Team');

  // 3. Positional Tiers Sheet
  const tierData = players.map((p) => ({
    'Position': p.pos,
    'Tier': p.tier,
    'Pos Rank': p.posRank,
    'Name': p.name,
    'Team': p.team,
    'Status': p.status,
  }));
  const wsTiers = XLSX.utils.json_to_sheet(tierData);
  XLSX.utils.book_append_sheet(wb, wsTiers, 'Positional Tiers');

  // Download XLSX
  const filename = `Fantasy_Football_Command_Center_2026_${settings.scoringFormat}_${settings.leagueSize}Teams.xlsx`;
  XLSX.writeFile(wb, filename);
}

export const PYTHON_STREAMLIT_CODE = `import streamlit as st
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

st.set_page_config(page_title="Fantasy Football Command Center 2026", layout="wide", page_icon="🏈")

st.title("🏈 FANTASY FOOTBALL COMMAND CENTER 2026")
st.markdown("*Analysen, Rankings, Tiers & Live-Draft Assistant – nach The Fantasy Footballers Methodik*")

# Sidebar Configuration
st.sidebar.header("⚙️ Liga-Einstellungen")
league_size = st.sidebar.selectbox("Liga-Größe (N)", [8, 10, 12, 14, 16], index=2)
scoring_mode = st.sidebar.selectbox("Scoring-Format", ["Half-PPR", "Full-PPR", "Standard"])
league_type = st.sidebar.selectbox("Liga-Typ", ["Redraft", "Dynasty"])

# Dynamic Pick Calculation Formula
def get_pick_string(ovr_rank, N):
    round_num = int((ovr_rank - 1) // N) + 1
    pick_in_round = int((ovr_rank - 1) % N) + 1
    return f"Rd {round_num} ({round_num}.{pick_in_round:02d})"

# Generate Sample Dataframe
data = [
    {"Ovr_Rank": 1, "Pos_Rank": "RB1", "Name": "Christian McCaffrey", "Pos": "RB", "Team": "SF", "Bye": 9, "Tier": "Tier 1: Legendary Bellcows", "Status": "Verfügbar", "Target_Share": 0.19, "RZ_Touches": 64, "Air_Yards": 0.12, "VORP": 85.0, "Profile": "Unangefochtener 1.01 Overall in Half-PPR."},
    {"Ovr_Rank": 2, "Pos_Rank": "RB2", "Name": "Breece Hall", "Pos": "RB", "Team": "NYJ", "Bye": 12, "Tier": "Tier 1: Legendary Bellcows", "Status": "Verfügbar", "Target_Share": 0.18, "RZ_Touches": 52, "Air_Yards": 0.10, "VORP": 68.5, "Profile": "Dynasty RB1 Potenzial."},
    {"Ovr_Rank": 3, "Pos_Rank": "RB3", "Name": "Bijan Robinson", "Pos": "RB", "Team": "ATL", "Bye": 12, "Tier": "Tier 1: Legendary Bellcows", "Status": "Verfügbar", "Target_Share": 0.17, "RZ_Touches": 48, "Air_Yards": 0.08, "VORP": 56.0, "Profile": "Mike's My Guy."},
    {"Ovr_Rank": 4, "Pos_Rank": "WR1", "Name": "CeeDee Lamb", "Pos": "WR", "Team": "DAL", "Bye": 7, "Tier": "Tier 1: Alpha Target Monsters", "Status": "Verfügbar", "Target_Share": 0.31, "RZ_Touches": 28, "Air_Yards": 0.39, "VORP": 72.0, "Profile": "Andy's WR1 overall."},
    {"Ovr_Rank": 5, "Pos_Rank": "WR2", "Name": "Tyreek Hill", "Pos": "WR", "Team": "MIA", "Bye": 6, "Tier": "Tier 1: Alpha Target Monsters", "Status": "Verfügbar", "Target_Share": 0.32, "RZ_Touches": 24, "Air_Yards": 0.44, "VORP": 65.0, "Profile": "Gamebreaking Ceiling."},
]

df = pd.DataFrame(data)
df["Pick"] = df["Ovr_Rank"].apply(lambda rank: get_pick_string(rank, league_size))

# Interactive Data Editor
st.subheader("🎯 Master Draft Board")
edited_df = st.data_editor(
    df,
    column_config={
        "Status": st.column_config.SelectboxColumn("Status", options=["Verfügbar", "Mein Team", "Gedraftet (Gegner)"], required=True),
        "Target_Share": st.column_config.NumberColumn("Target Share", format="%.2f"),
    },
    disabled=["Ovr_Rank", "Pick", "Name", "Pos", "Team"],
    hide_index=True,
)

# Live Alerts Calculation
st.subheader("⚠️ Live Alerts & Stack Radar")
my_team = edited_df[edited_df["Status"] == "Mein Team"]

# Stack Radar Check
qbs = my_team[my_team["Pos"] == "QB"]["Team"].tolist()
pass_catchers = my_team[my_team["Pos"].isin(["WR", "TE"])]["Team"].tolist()
for team in qbs:
    if team in pass_catchers:
        st.success(f"⚡ Stack Aktiviert! QB + Pass-Catcher Kombi für Team {team} gedraftet!")

# Run via: py -m streamlit run app.py
`;
