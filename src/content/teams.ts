import type { TeamDef } from './types';

type Row = [
  id: string,
  name: string,
  short: string,
  nation: string,
  primary: string,
  secondary: string,
  accent: string,
  livery: string,
  perf: number,
  reliability: number,
  prestige: number,
  budget: number,
  principal: string,
];

function rows(series: string, list: Row[]): TeamDef[] {
  return list.map(([id, name, short, nation, primary, secondary, accent, livery, perf, reliability, prestige, budget, principal]) => ({
    id: `${series}-${id}`,
    series,
    name,
    short,
    nation,
    colors: { primary, secondary, accent },
    livery,
    perf,
    reliability,
    prestige,
    budget,
    principal,
  }));
}

/**
 * Every team is fictional. Liveries reference patterns in src/art/liveries.
 * Add a team by adding a row; the world generator staffs it automatically.
 */
export const TEAMS: TeamDef[] = [
  ...rows('prime', [
    ['aurelia', 'Aurelia Racing', 'AUR', 'CH', '#15161C', '#D4A63A', '#F5E6B8', 'arrow', 88, 86, 90, 92, 'Matthias Vogel'],
    ['falcon', 'Falcon Grand Prix', 'FAL', 'GB', '#14254D', '#FF7A1A', '#FFFFFF', 'sash', 85, 88, 86, 88, 'Harriet Cole'],
    ['vento', 'Scuderia Vento', 'VEN', 'IT', '#C8102E', '#FFD23F', '#FFFFFF', 'classic', 84, 80, 94, 90, 'Lorenzo Bassi'],
    ['northstar', 'Northstar Motorsport', 'NST', 'DE', '#B8C2CC', '#00A19A', '#101820', 'fade', 82, 90, 85, 86, 'Anke Brandt'],
    ['kestrel', 'Kestrel Racing', 'KES', 'FR', '#1F4FD1', '#FFD400', '#FFFFFF', 'split', 72, 82, 72, 70, 'Julien Mercier'],
    ['titan', 'Titan Dynamics', 'TTN', 'US', '#5B2C83', '#C9CED6', '#FF4FA3', 'bolt', 68, 78, 66, 74, 'Brady Holloway'],
    ['obsidian', 'Obsidian GP', 'OBS', 'NL', '#0B0B0D', '#39FF88', '#FFFFFF', 'pinstripe', 63, 76, 60, 62, 'Sander de Wit'],
    ['meridian', 'Meridian Racing', 'MER', 'JP', '#F4F6FA', '#3AA0FF', '#E4002B', 'halves', 60, 84, 62, 64, 'Kenji Morimoto'],
    ['solaris', 'Solaris Racing', 'SOL', 'ES', '#FFC72C', '#2B2B2B', '#FF5A1F', 'classic', 52, 72, 52, 50, 'Inés Robledo'],
    ['hammerhead', 'Hammerhead Racing', 'HHR', 'AU', '#5E6B78', '#E63946', '#F1FAEE', 'sash', 47, 70, 45, 44, 'Declan Moss'],
  ]),
  ...rows('apex', [
    ['veltro', 'Veltro Racing', 'VEL', 'IT', '#B3001B', '#FFFFFF', '#1A1A1A', 'classic', 80, 85, 80, 78, 'Paolo Serafini'],
    ['blackwood', 'Blackwood Motorsport', 'BLK', 'GB', '#101820', '#E0B04A', '#FFFFFF', 'pinstripe', 78, 86, 76, 76, 'Graham Pike'],
    ['lumiere', 'Équipe Lumière', 'LUM', 'FR', '#1D3F8F', '#6FD3FF', '#FFFFFF', 'fade', 74, 82, 72, 70, 'Camille Roux'],
    ['dune', 'Dune Racing', 'DUN', 'NL', '#FF6F00', '#1B1B1B', '#FFFFFF', 'arrow', 70, 80, 68, 66, 'Pieter Hoekstra'],
    ['iberia', 'Meseta Sport', 'MES', 'ES', '#8A1538', '#F2C14E', '#FFFFFF', 'sash', 66, 78, 64, 60, 'Marta Olivares'],
    ['kaiser', 'Kaiser Motorsport', 'KAI', 'DE', '#E6E8EB', '#D00000', '#111111', 'halves', 64, 84, 62, 62, 'Dieter Lang'],
    ['southerncross', 'Southern Cross Racing', 'SXR', 'AU', '#003A70', '#FFCD00', '#FFFFFF', 'split', 60, 76, 58, 56, 'Bronte Hayes'],
    ['pacificrim', 'Pacific Rim Racing', 'PRR', 'JP', '#FFFFFF', '#E60033', '#111111', 'bolt', 58, 82, 56, 58, 'Aiko Tanabe'],
    ['condor', 'Condor Racing', 'CDR', 'AR', '#7CB9E8', '#FFFFFF', '#F4B400', 'arrow', 54, 74, 50, 48, 'Martín Ferreyra'],
    ['nordicedge', 'Nordic Edge', 'NDE', 'SE', '#0B3D2E', '#9AE6B4', '#FFFFFF', 'pinstripe', 50, 72, 46, 44, 'Linnea Berg'],
  ]),
  ...rows('contender', [
    ['redline', 'Redline Juniors', 'RDL', 'GB', '#D7263D', '#1B1B1E', '#FFFFFF', 'classic', 78, 84, 70, 70, 'Owen Price'],
    ['stellar', 'Stellar Racing', 'STL', 'FR', '#2D1E6B', '#F9C80E', '#FFFFFF', 'bolt', 75, 82, 66, 66, 'Hugo Garnier'],
    ['momentum', 'Momentum Motorsport', 'MOM', 'DE', '#00B4D8', '#03045E', '#FFFFFF', 'fade', 72, 80, 62, 62, 'Sven Kramer'],
    ['quicksilver', 'Quicksilver Racing', 'QSR', 'IT', '#C0C5CE', '#222831', '#E63946', 'sash', 68, 80, 58, 58, 'Giulia Marchetti'],
    ['cobalt', 'Cobalt Motorsport', 'CBT', 'ES', '#0047AB', '#FF8C42', '#FFFFFF', 'split', 65, 78, 55, 55, 'Álvaro Mena'],
    ['thunderbolt', 'Thunderbolt Racing', 'TBR', 'US', '#FFE600', '#101010', '#FFFFFF', 'bolt', 62, 76, 52, 52, 'Cody Barnes'],
    ['zenith', 'Zenith Racing', 'ZEN', 'CH', '#FFFFFF', '#00A86B', '#101010', 'halves', 58, 80, 50, 50, 'Reto Keller'],
    ['ember', 'Ember Motorsport', 'EMB', 'BE', '#FF4500', '#2E2E2E', '#FFD6A5', 'arrow', 55, 74, 46, 46, 'Lotte Peeters'],
    ['arrowhead', 'Arrowhead Racing', 'ARH', 'NZ', '#006D77', '#83C5BE', '#FFFFFF', 'pinstripe', 52, 74, 44, 42, 'Tama Rewi'],
    ['orbit', 'Orbit Racing', 'ORB', 'BR', '#6A0DAD', '#00E5FF', '#FFFFFF', 'fade', 48, 70, 40, 38, 'Rafael Moura'],
  ]),
  ...rows('cadet', [
    ['giants', 'Little Giants Racing', 'LGR', 'GB', '#FF1654', '#FFFFFF', '#247BA0', 'classic', 76, 82, 62, 60, 'Nia Oduya'],
    ['pioneer', 'Pioneer Motorsport', 'PNR', 'DE', '#2B59C3', '#F5F5F5', '#E71D36', 'split', 73, 80, 58, 58, 'Kai Fischer'],
    ['rocket', 'Rocket Juniors', 'RKT', 'IT', '#F24C00', '#1A1A1A', '#FFFFFF', 'bolt', 70, 80, 56, 54, 'Marco Ferri'],
    ['bluebird', 'Bluebird Racing', 'BLU', 'FR', '#4CC9F0', '#3A0CA3', '#FFFFFF', 'fade', 67, 78, 52, 52, 'Élodie Blanc'],
    ['fox', 'Vixen Motorsport', 'VIX', 'NL', '#FF9F1C', '#2EC4B6', '#FFFFFF', 'arrow', 64, 78, 50, 50, 'Jesse Vos'],
    ['lynx', 'Ocelot Racing', 'OCE', 'FI', '#8D99AE', '#EF233C', '#2B2D42', 'sash', 61, 76, 48, 46, 'Aino Laine'],
    ['nova', 'Aster Junior Team', 'AST', 'ES', '#9B5DE5', '#F15BB5', '#FFFFFF', 'halves', 58, 74, 45, 44, 'Pablo Ruiz'],
    ['spark', 'Ignis Racing', 'IGN', 'US', '#FEE440', '#00BBF9', '#111111', 'bolt', 55, 74, 42, 40, 'Tyler Grant'],
    ['trailblazer', 'Trailblazer Motorsport', 'TRB', 'CA', '#2D6A4F', '#D8F3DC', '#FFFFFF', 'pinstripe', 52, 72, 40, 38, 'Megan Fraser'],
    ['wildcat', 'Wildcat Racing', 'WLD', 'AU', '#E63946', '#1D3557', '#F1FAEE', 'classic', 48, 70, 36, 34, 'Josh Kerr'],
  ]),
  ...rows('endurance', [
    ['brennholt', 'Brennholt Hypercar', 'BRH', 'DE', '#DADFE3', '#111111', '#E10600', 'pinstripe', 86, 86, 88, 88, 'Katrin Hesse'],
    ['sorano', 'Sorano Hybrid Racing', 'SOR', 'JP', '#FFFFFF', '#E50914', '#111111', 'bolt', 85, 92, 86, 88, 'Hiroshi Kanda'],
    ['vauclair', 'Vauclair Endurance', 'VAU', 'FR', '#0D47A1', '#FFFFFF', '#E53935', 'split', 84, 84, 86, 84, 'Antoine Vauclair'],
    ['castellano', 'Castellano Endurance', 'CAS', 'IT', '#D50000', '#FFD600', '#FFFFFF', 'classic', 83, 82, 88, 84, 'Federico Castellano'],
    ['hollis', 'Hollis Racing', 'HOL', 'GB', '#0B4F3C', '#D4AF37', '#FFFFFF', 'arrow', 76, 82, 74, 72, 'Edward Hollis'],
    ['ridgeback', 'Ridgeback Motorsport', 'RDG', 'US', '#141414', '#FFC300', '#FFFFFF', 'halves', 74, 80, 70, 72, 'Wade Mercer'],
    ['lumiere', 'Lumière Endurance', 'LUE', 'FR', '#101D42', '#8EE3F5', '#FFFFFF', 'fade', 70, 80, 66, 64, 'Margaux Dupuis'],
    ['monolith', 'Monolith Racing', 'MNL', 'CH', '#2F3437', '#FFFFFF', '#FF3B30', 'sash', 66, 84, 62, 66, 'Beat Zimmermann'],
    ['tempest', 'Squall Racing', 'SQL', 'GB', '#3E1F47', '#FF9F1C', '#FFFFFF', 'bolt', 62, 76, 58, 56, 'Rhys Morgan'],
    ['condor', 'Condor Endurance', 'CDE', 'AR', '#7CB9E8', '#FFFFFF', '#F4B400', 'arrow', 58, 74, 54, 50, 'Ramiro Quiroga'],
  ]),
  ...rows('american', [
    ['patriot', 'Patriot Racing', 'PAT', 'US', '#0A3161', '#FFFFFF', '#B31942', 'classic', 80, 84, 82, 82, 'Rick Donovan'],
    ['lonestar', 'Alamo Ridge Motorsports', 'ARM', 'US', '#BF0A30', '#FFFFFF', '#002868', 'sash', 78, 82, 78, 78, 'Travis McCall'],
    ['bluegrass', 'Bluegrass Racing', 'BGR', 'US', '#1E88E5', '#C6FF00', '#0D1B2A', 'bolt', 74, 82, 72, 70, 'June Whitaker'],
    ['goldengate', 'Golden Gate Racing', 'GGR', 'US', '#E0592A', '#111111', '#FFFFFF', 'arrow', 72, 80, 70, 70, 'Maya Lindqvist'],
    ['motorcity', 'Motor City Motorsports', 'MCM', 'US', '#212121', '#00C853', '#FFFFFF', 'pinstripe', 70, 84, 70, 68, 'Frank Kowalczyk'],
    ['canyon', 'Canyon Racing', 'CNR', 'US', '#C1440E', '#F4D35E', '#1B1B1B', 'fade', 66, 78, 62, 60, 'Dusty Harlan'],
    ['northernlights', 'Northern Lights Racing', 'NLR', 'CA', '#00897B', '#B388FF', '#FFFFFF', 'split', 64, 80, 60, 60, 'Claire Dubois'],
    ['keystone', 'Keystone Racing', 'KEY', 'US', '#FFD600', '#1A237E', '#FFFFFF', 'halves', 60, 76, 56, 54, 'Pete Novak'],
    ['pelican', 'Pelican Racing', 'PEL', 'US', '#F48FB1', '#263238', '#FFFFFF', 'classic', 56, 74, 52, 50, 'Beau Landry'],
    ['thunderbird', 'Thunderbird Racing', 'THB', 'US', '#4A148C', '#FFAB00', '#FFFFFF', 'bolt', 52, 72, 48, 46, 'Sam Whitfield'],
  ]),
  ...rows('gt', [
    ['castellano', 'Castellano Corse', 'CAS', 'IT', '#D50000', '#FFD600', '#FFFFFF', 'classic', 80, 84, 80, 80, 'Federico Castellano'],
    ['brennholt', 'Brennholt Motorsport', 'BRH', 'DE', '#C9CED3', '#111111', '#E10600', 'pinstripe', 79, 88, 80, 82, 'Jonas Albrecht'],
    ['vauclair', 'Vauclair Racing', 'VAU', 'FR', '#0D47A1', '#FFFFFF', '#E53935', 'split', 74, 82, 74, 74, 'Léa Fontaine'],
    ['hollis', 'Hollis Performance', 'HOL', 'GB', '#0B4F3C', '#D4AF37', '#FFFFFF', 'arrow', 73, 84, 74, 72, 'Edward Hollis'],
    ['sorano', 'Sorano Works', 'SOR', 'JP', '#FFFFFF', '#E50914', '#111111', 'bolt', 72, 90, 72, 74, 'Daichi Mori'],
    ['kavanagh', 'Kavanagh GT', 'KAV', 'IE', '#FF6B00', '#111111', '#FFFFFF', 'sash', 66, 78, 62, 60, 'Siobhán Kavanagh'],
    ['ridgeback', 'Ridgeback Racing', 'RDG', 'US', '#141414', '#FFC300', '#FFFFFF', 'halves', 65, 80, 64, 66, 'Wade Mercer'],
    ['valkyr', 'Valkyr Motorsport', 'VLK', 'SE', '#A7D8FF', '#0A1A2F', '#FFFFFF', 'fade', 62, 82, 60, 60, 'Freja Lindholm'],
    ['atlas', 'Atlas Racing', 'ATL', 'US', '#1B263B', '#E0E1DD', '#E63946', 'pinstripe', 58, 78, 56, 56, 'Carter Hale'],
    ['serrano', 'Serrano Motorsport', 'SER', 'ES', '#7B1E3A', '#F2C14E', '#FFFFFF', 'classic', 55, 76, 52, 50, 'Diego Serrano'],
  ]),
];

export const TEAM_DEF_MAP: Record<string, TeamDef> = Object.fromEntries(TEAMS.map((t) => [t.id, t]));
