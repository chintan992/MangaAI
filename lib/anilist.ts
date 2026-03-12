export const ANILIST_API_URL = 'https://graphql.anilist.co';

export interface MangaRelation {
  relationType: string;
  node: {
    id: number;
    title: { romaji: string; english: string };
    coverImage: { medium: string; large: string };
    type: string;
  };
}

export interface MangaRecommendation {
  mediaRecommendation: {
    id: number;
    title: { romaji: string; english: string };
    coverImage: { medium: string; large: string };
    type: string;
  };
}

export interface Manga {
  id: number;
  title: {
    romaji: string;
    english: string;
    native: string;
  };
  coverImage: {
    extraLarge: string;
    large: string;
    medium: string;
  };
  description: string;
  genres: string[];
  averageScore: number;
  status: string;
  chapters: number;
  volumes: number;
  episodes?: number;
  format?: string;
  source?: string;
  startDate?: { year: number; month: number; day: number };
  endDate?: { year: number; month: number; day: number };
  relations?: { edges: MangaRelation[] };
  recommendations?: { nodes: MangaRecommendation[] };
}

const MANGA_FRAGMENT = `
  fragment MangaFragment on Media {
    id
    title {
      romaji
      english
      native
    }
    coverImage {
      extraLarge
      large
      medium
    }
    description
    genres
    averageScore
    status
    chapters
    volumes
    episodes
    format
    source
    startDate { year month day }
    endDate { year month day }
    relations {
      edges {
        relationType
        node {
          id
          title { romaji english }
          coverImage { medium large }
          type
        }
      }
    }
    recommendations(page: 1, perPage: 6, sort: RATING_DESC) {
      nodes {
        mediaRecommendation {
          id
          title { romaji english }
          coverImage { medium large }
          type
        }
      }
    }
  }
`;

const TRENDING_MANGA_QUERY = `
  ${MANGA_FRAGMENT}
  query ($page: Int, $perPage: Int) {
    Page (page: $page, perPage: $perPage) {
      media (type: MANGA, sort: TRENDING_DESC) {
        ...MangaFragment
      }
    }
  }
`;

const SEARCH_MANGA_QUERY = `
  ${MANGA_FRAGMENT}
  query ($search: String, $page: Int, $perPage: Int) {
    Page (page: $page, perPage: $perPage) {
      media (type: MANGA, search: $search, sort: SEARCH_MATCH) {
        ...MangaFragment
      }
    }
  }
`;

const MANGA_BY_IDS_QUERY = `
  ${MANGA_FRAGMENT}
  query ($idIn: [Int], $page: Int, $perPage: Int) {
    Page (page: $page, perPage: $perPage) {
      media (type: MANGA, id_in: $idIn) {
        ...MangaFragment
      }
    }
  }
`;

const MANGA_BY_ID_QUERY = `
  ${MANGA_FRAGMENT}
  query ($id: Int) {
    Media (id: $id) {
      ...MangaFragment
    }
  }
`;

export async function fetchTrendingManga(page = 1, perPage = 20): Promise<Manga[]> {
  const response = await fetch(ANILIST_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      query: TRENDING_MANGA_QUERY,
      variables: { page, perPage }
    })
  });

  const data = await response.json();
  return data?.data?.Page?.media || [];
}

export async function searchManga(search: string, page = 1, perPage = 20): Promise<Manga[]> {
  const response = await fetch(ANILIST_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      query: SEARCH_MANGA_QUERY,
      variables: { search, page, perPage }
    })
  });

  const data = await response.json();
  return data?.data?.Page?.media || [];
}

export async function fetchMangaByIds(idIn: number[], page = 1, perPage = 20): Promise<Manga[]> {
  if (!idIn || idIn.length === 0) return [];
  const response = await fetch(ANILIST_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      query: MANGA_BY_IDS_QUERY,
      variables: { idIn, page, perPage }
    })
  });

  const data = await response.json();
  return data?.data?.Page?.media || [];
}

export async function fetchMangaById(id: number): Promise<Manga | null> {
  const response = await fetch(ANILIST_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      query: MANGA_BY_ID_QUERY,
      variables: { id }
    })
  });

  const data = await response.json();
  return data?.data?.Media || null;
}

export async function getAniListUser(token: string) {
  const query = `
    query {
      Viewer {
        id
        name
        avatar {
          large
          medium
        }
      }
    }
  `;
  const response = await fetch(ANILIST_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
    body: JSON.stringify({ query })
  });
  const data = await response.json();
  if (data.errors) {
    throw new Error(data.errors[0].message);
  }
  return data?.data?.Viewer || null;
}
