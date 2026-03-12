export async function fetchUserDashboardData(token: string, userId: number) {
  const query = `
    query ($userId: Int!) {
      Viewer {
        id
        name
        avatar {
          large
        }
        bannerImage
        statistics {
          anime {
            count
            meanScore
            minutesWatched
            episodesWatched
          }
          manga {
            count
            meanScore
            chaptersRead
            volumesRead
          }
        }
        favourites {
          anime(page: 1, perPage: 6) {
            nodes {
              id
              title {
                romaji
                english
              }
              coverImage {
                large
              }
              type
            }
          }
          manga(page: 1, perPage: 6) {
            nodes {
              id
              title {
                romaji
                english
              }
              coverImage {
                large
              }
              type
            }
          }
        }
      }
      currentAnime: MediaListCollection(userId: $userId, type: ANIME, status: CURRENT) {
        lists {
          entries {
            id
            progress
            media {
              id
              title {
                romaji
                english
              }
              coverImage {
                large
              }
              episodes
              nextAiringEpisode {
                airingAt
                timeUntilAiring
                episode
              }
            }
          }
        }
      }
      currentManga: MediaListCollection(userId: $userId, type: MANGA, status: CURRENT) {
        lists {
          entries {
            id
            progress
            media {
              id
              title {
                romaji
                english
              }
              coverImage {
                large
              }
              chapters
            }
          }
        }
      }
    }
  `;

  const response = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables: { userId },
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch dashboard data');
  }

  const json = await response.json();
  return json.data;
}

export async function fetchUserActivity(token: string, userId: number) {
  const query = `
    query ($userId: Int!) {
      Page(page: 1, perPage: 10) {
        activities(userId: $userId, type: MEDIA_LIST, sort: ID_DESC) {
          ... on ListActivity {
            id
            type
            status
            progress
            createdAt
            media {
              id
              title {
                romaji
                english
              }
              coverImage {
                medium
              }
              type
            }
          }
        }
      }
    }
  `;

  const response = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables: { userId },
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user activity');
  }

  const json = await response.json();
  return json.data.Page.activities;
}
