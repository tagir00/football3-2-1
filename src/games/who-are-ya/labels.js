// English → Turkish display labels for nationalities and leagues.
// The underlying comparison still runs on the English strings so the map
// is only for what the user sees on the tiles.

const NATIONALITY_TR = {
  'Algeria': 'Cezayir',
  'Argentina': 'Arjantin',
  'Austria': 'Avusturya',
  'Belgium': 'Belçika',
  'Bosnia-Herzegovina': 'Bosna Hersek',
  'Brazil': 'Brezilya',
  'Burkina Faso': 'Burkina Faso',
  'Cameroon': 'Kamerun',
  'Canada': 'Kanada',
  'Colombia': 'Kolombiya',
  "Cote d'Ivoire": 'Fildişi Sahili',
  'Croatia': 'Hırvatistan',
  'Czech Republic': 'Çekya',
  'DR Congo': 'Kongo DC',
  'Denmark': 'Danimarka',
  'Ecuador': 'Ekvador',
  'Egypt': 'Mısır',
  'England': 'İngiltere',
  'France': 'Fransa',
  'Georgia': 'Gürcistan',
  'Germany': 'Almanya',
  'Ghana': 'Gana',
  'Greece': 'Yunanistan',
  'Guinea': 'Gine',
  'Hungary': 'Macaristan',
  'Italy': 'İtalya',
  'Japan': 'Japonya',
  'Korea, South': 'Güney Kore',
  'Mali': 'Mali',
  'Mexico': 'Meksika',
  'Morocco': 'Fas',
  'Netherlands': 'Hollanda',
  'Nigeria': 'Nijerya',
  'Northern Ireland': 'Kuzey İrlanda',
  'Norway': 'Norveç',
  'Poland': 'Polonya',
  'Portugal': 'Portekiz',
  'Russia': 'Rusya',
  'Scotland': 'İskoçya',
  'Senegal': 'Senegal',
  'Serbia': 'Sırbistan',
  'Slovakia': 'Slovakya',
  'Slovenia': 'Slovenya',
  'Spain': 'İspanya',
  'Sweden': 'İsveç',
  'Switzerland': 'İsviçre',
  'Türkiye': 'Türkiye',
  'Ukraine': 'Ukrayna',
  'United States': 'ABD',
  'Uruguay': 'Uruguay',
  'Uzbekistan': 'Özbekistan',
};

const LEAGUE_TR = {
  'Premier League': 'Premier Lig',
  'LaLiga': 'La Liga',
  'Serie A': 'Serie A',
  'Bundesliga': 'Bundesliga',
  'Ligue 1': 'Ligue 1',
  'Super Lig': 'Süper Lig',
  'Eredivisie': 'Eredivisie',
  'Primeira Liga': 'Portekiz Ligi',
};

export function nationalityTr(en) {
  return NATIONALITY_TR[en] ?? en;
}

export function leagueTr(en) {
  return LEAGUE_TR[en] ?? en;
}
