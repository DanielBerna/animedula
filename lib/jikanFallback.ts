import type { JikanAnime, JikanManga } from './jikan'

/** Respaldo local si Jikan devuelve 429 o falla en build/deploy */
export const FALLBACK_TOP_ANIME: JikanAnime[] = [
  {
    "mal_id": 52991,
    "title": "Sousou no Frieren",
    "score": 9.26,
    "images": {
      "jpg": {
        "image_url": "https://cdn.myanimelist.net/images/anime/1015/138006.jpg",
        "small_image_url": "https://cdn.myanimelist.net/images/anime/1015/138006t.jpg",
        "large_image_url": "https://cdn.myanimelist.net/images/anime/1015/138006l.jpg"
      },
      "webp": {
        "image_url": "https://cdn.myanimelist.net/images/anime/1015/138006.webp",
        "small_image_url": "https://cdn.myanimelist.net/images/anime/1015/138006t.webp",
        "large_image_url": "https://cdn.myanimelist.net/images/anime/1015/138006l.webp"
      }
    }
  },
  {
    "mal_id": 61469,
    "title": "Steel Ball Run: JoJo no Kimyou na Bouken",
    "score": 9.13,
    "images": {
      "jpg": {
        "image_url": "https://cdn.myanimelist.net/images/anime/1448/154111.jpg",
        "small_image_url": "https://cdn.myanimelist.net/images/anime/1448/154111t.jpg",
        "large_image_url": "https://cdn.myanimelist.net/images/anime/1448/154111l.jpg"
      },
      "webp": {
        "image_url": "https://cdn.myanimelist.net/images/anime/1448/154111.webp",
        "small_image_url": "https://cdn.myanimelist.net/images/anime/1448/154111t.webp",
        "large_image_url": "https://cdn.myanimelist.net/images/anime/1448/154111l.webp"
      }
    }
  },
  {
    "mal_id": 5114,
    "title": "Fullmetal Alchemist: Brotherhood",
    "score": 9.11,
    "images": {
      "jpg": {
        "image_url": "https://cdn.myanimelist.net/images/anime/1208/94745.jpg",
        "small_image_url": "https://cdn.myanimelist.net/images/anime/1208/94745t.jpg",
        "large_image_url": "https://cdn.myanimelist.net/images/anime/1208/94745l.jpg"
      },
      "webp": {
        "image_url": "https://cdn.myanimelist.net/images/anime/1208/94745.webp",
        "small_image_url": "https://cdn.myanimelist.net/images/anime/1208/94745t.webp",
        "large_image_url": "https://cdn.myanimelist.net/images/anime/1208/94745l.webp"
      }
    }
  },
  {
    "mal_id": 57555,
    "title": "Chainsaw Man Movie: Reze-hen",
    "score": 9.07,
    "images": {
      "jpg": {
        "image_url": "https://cdn.myanimelist.net/images/anime/1763/150638.jpg",
        "small_image_url": "https://cdn.myanimelist.net/images/anime/1763/150638t.jpg",
        "large_image_url": "https://cdn.myanimelist.net/images/anime/1763/150638l.jpg"
      },
      "webp": {
        "image_url": "https://cdn.myanimelist.net/images/anime/1763/150638.webp",
        "small_image_url": "https://cdn.myanimelist.net/images/anime/1763/150638t.webp",
        "large_image_url": "https://cdn.myanimelist.net/images/anime/1763/150638l.webp"
      }
    }
  },
  {
    "mal_id": 9253,
    "title": "Steins;Gate",
    "score": 9.07,
    "images": {
      "jpg": {
        "image_url": "https://cdn.myanimelist.net/images/anime/1935/127974.jpg",
        "small_image_url": "https://cdn.myanimelist.net/images/anime/1935/127974t.jpg",
        "large_image_url": "https://cdn.myanimelist.net/images/anime/1935/127974l.jpg"
      },
      "webp": {
        "image_url": "https://cdn.myanimelist.net/images/anime/1935/127974.webp",
        "small_image_url": "https://cdn.myanimelist.net/images/anime/1935/127974t.webp",
        "large_image_url": "https://cdn.myanimelist.net/images/anime/1935/127974l.webp"
      }
    }
  },
  {
    "mal_id": 38524,
    "title": "Shingeki no Kyojin Season 3 Part 2",
    "score": 9.05,
    "images": {
      "jpg": {
        "image_url": "https://cdn.myanimelist.net/images/anime/1517/100633.jpg",
        "small_image_url": "https://cdn.myanimelist.net/images/anime/1517/100633t.jpg",
        "large_image_url": "https://cdn.myanimelist.net/images/anime/1517/100633l.jpg"
      },
      "webp": {
        "image_url": "https://cdn.myanimelist.net/images/anime/1517/100633.webp",
        "small_image_url": "https://cdn.myanimelist.net/images/anime/1517/100633t.webp",
        "large_image_url": "https://cdn.myanimelist.net/images/anime/1517/100633l.webp"
      }
    }
  },
  {
    "mal_id": 28977,
    "title": "Gintama°",
    "score": 9.05,
    "images": {
      "jpg": {
        "image_url": "https://cdn.myanimelist.net/images/anime/3/72078.jpg",
        "small_image_url": "https://cdn.myanimelist.net/images/anime/3/72078t.jpg",
        "large_image_url": "https://cdn.myanimelist.net/images/anime/3/72078l.jpg"
      },
      "webp": {
        "image_url": "https://cdn.myanimelist.net/images/anime/3/72078.webp",
        "small_image_url": "https://cdn.myanimelist.net/images/anime/3/72078t.webp",
        "large_image_url": "https://cdn.myanimelist.net/images/anime/3/72078l.webp"
      }
    }
  },
  {
    "mal_id": 39486,
    "title": "Gintama: The Final",
    "score": 9.05,
    "images": {
      "jpg": {
        "image_url": "https://cdn.myanimelist.net/images/anime/1245/116760.jpg",
        "small_image_url": "https://cdn.myanimelist.net/images/anime/1245/116760t.jpg",
        "large_image_url": "https://cdn.myanimelist.net/images/anime/1245/116760l.jpg"
      },
      "webp": {
        "image_url": "https://cdn.myanimelist.net/images/anime/1245/116760.webp",
        "small_image_url": "https://cdn.myanimelist.net/images/anime/1245/116760t.webp",
        "large_image_url": "https://cdn.myanimelist.net/images/anime/1245/116760l.webp"
      }
    }
  },
  {
    "mal_id": 11061,
    "title": "Hunter x Hunter (2011)",
    "score": 9.03,
    "images": {
      "jpg": {
        "image_url": "https://cdn.myanimelist.net/images/anime/1337/99013.jpg",
        "small_image_url": "https://cdn.myanimelist.net/images/anime/1337/99013t.jpg",
        "large_image_url": "https://cdn.myanimelist.net/images/anime/1337/99013l.jpg"
      },
      "webp": {
        "image_url": "https://cdn.myanimelist.net/images/anime/1337/99013.webp",
        "small_image_url": "https://cdn.myanimelist.net/images/anime/1337/99013t.webp",
        "large_image_url": "https://cdn.myanimelist.net/images/anime/1337/99013l.webp"
      }
    }
  },
  {
    "mal_id": 61316,
    "title": "Re:Zero kara Hajimeru Isekai Seikatsu 4th Season",
    "score": 9.02,
    "images": {
      "jpg": {
        "image_url": "https://cdn.myanimelist.net/images/anime/1540/155824.jpg",
        "small_image_url": "https://cdn.myanimelist.net/images/anime/1540/155824t.jpg",
        "large_image_url": "https://cdn.myanimelist.net/images/anime/1540/155824l.jpg"
      },
      "webp": {
        "image_url": "https://cdn.myanimelist.net/images/anime/1540/155824.webp",
        "small_image_url": "https://cdn.myanimelist.net/images/anime/1540/155824t.webp",
        "large_image_url": "https://cdn.myanimelist.net/images/anime/1540/155824l.webp"
      }
    }
  },
  {
    "mal_id": 9969,
    "title": "Gintama'",
    "score": 9.02,
    "images": {
      "jpg": {
        "image_url": "https://cdn.myanimelist.net/images/anime/4/50361.jpg",
        "small_image_url": "https://cdn.myanimelist.net/images/anime/4/50361t.jpg",
        "large_image_url": "https://cdn.myanimelist.net/images/anime/4/50361l.jpg"
      },
      "webp": {
        "image_url": "https://cdn.myanimelist.net/images/anime/4/50361.webp",
        "small_image_url": "https://cdn.myanimelist.net/images/anime/4/50361t.webp",
        "large_image_url": "https://cdn.myanimelist.net/images/anime/4/50361l.webp"
      }
    }
  },
  {
    "mal_id": 15417,
    "title": "Gintama': Enchousen",
    "score": 9.02,
    "images": {
      "jpg": {
        "image_url": "https://cdn.myanimelist.net/images/anime/1452/123686.jpg",
        "small_image_url": "https://cdn.myanimelist.net/images/anime/1452/123686t.jpg",
        "large_image_url": "https://cdn.myanimelist.net/images/anime/1452/123686l.jpg"
      },
      "webp": {
        "image_url": "https://cdn.myanimelist.net/images/anime/1452/123686.webp",
        "small_image_url": "https://cdn.myanimelist.net/images/anime/1452/123686t.webp",
        "large_image_url": "https://cdn.myanimelist.net/images/anime/1452/123686l.webp"
      }
    }
  }
]

export const FALLBACK_TOP_MANGA: JikanManga[] = [
  {
    "mal_id": 2,
    "title": "Berserk",
    "score": 9.46,
    "chapters": null,
    "volumes": null,
    "images": {
      "jpg": {
        "image_url": "https://cdn.myanimelist.net/images/manga/1/157897.jpg",
        "small_image_url": "https://cdn.myanimelist.net/images/manga/1/157897t.jpg",
        "large_image_url": "https://cdn.myanimelist.net/images/manga/1/157897l.jpg"
      },
      "webp": {
        "image_url": "https://cdn.myanimelist.net/images/manga/1/157897.webp",
        "small_image_url": "https://cdn.myanimelist.net/images/manga/1/157897t.webp",
        "large_image_url": "https://cdn.myanimelist.net/images/manga/1/157897l.webp"
      }
    }
  },
  {
    "mal_id": 1706,
    "title": "JoJo no Kimyou na Bouken Part 7: Steel Ball Run",
    "score": 9.34,
    "chapters": 96,
    "volumes": 24,
    "images": {
      "jpg": {
        "image_url": "https://cdn.myanimelist.net/images/manga/3/179882.jpg",
        "small_image_url": "https://cdn.myanimelist.net/images/manga/3/179882t.jpg",
        "large_image_url": "https://cdn.myanimelist.net/images/manga/3/179882l.jpg"
      },
      "webp": {
        "image_url": "https://cdn.myanimelist.net/images/manga/3/179882.webp",
        "small_image_url": "https://cdn.myanimelist.net/images/manga/3/179882t.webp",
        "large_image_url": "https://cdn.myanimelist.net/images/manga/3/179882l.webp"
      }
    }
  },
  {
    "mal_id": 656,
    "title": "Vagabond",
    "score": 9.27,
    "chapters": 327,
    "volumes": 37,
    "images": {
      "jpg": {
        "image_url": "https://cdn.myanimelist.net/images/manga/1/259070.jpg",
        "small_image_url": "https://cdn.myanimelist.net/images/manga/1/259070t.jpg",
        "large_image_url": "https://cdn.myanimelist.net/images/manga/1/259070l.jpg"
      },
      "webp": {
        "image_url": "https://cdn.myanimelist.net/images/manga/1/259070.webp",
        "small_image_url": "https://cdn.myanimelist.net/images/manga/1/259070t.webp",
        "large_image_url": "https://cdn.myanimelist.net/images/manga/1/259070l.webp"
      }
    }
  },
  {
    "mal_id": 13,
    "title": "One Piece",
    "score": 9.21,
    "chapters": null,
    "volumes": null,
    "images": {
      "jpg": {
        "image_url": "https://cdn.myanimelist.net/images/manga/2/253146.jpg",
        "small_image_url": "https://cdn.myanimelist.net/images/manga/2/253146t.jpg",
        "large_image_url": "https://cdn.myanimelist.net/images/manga/2/253146l.jpg"
      },
      "webp": {
        "image_url": "https://cdn.myanimelist.net/images/manga/2/253146.webp",
        "small_image_url": "https://cdn.myanimelist.net/images/manga/2/253146t.webp",
        "large_image_url": "https://cdn.myanimelist.net/images/manga/2/253146l.webp"
      }
    }
  },
  {
    "mal_id": 162032,
    "title": "Guimi Zhi Zhu",
    "score": 9.19,
    "chapters": 366,
    "volumes": 18,
    "images": {
      "jpg": {
        "image_url": "https://cdn.myanimelist.net/images/manga/2/287344.jpg",
        "small_image_url": "https://cdn.myanimelist.net/images/manga/2/287344t.jpg",
        "large_image_url": "https://cdn.myanimelist.net/images/manga/2/287344l.jpg"
      },
      "webp": {
        "image_url": "https://cdn.myanimelist.net/images/manga/2/287344.webp",
        "small_image_url": "https://cdn.myanimelist.net/images/manga/2/287344t.webp",
        "large_image_url": "https://cdn.myanimelist.net/images/manga/2/287344l.webp"
      }
    }
  },
  {
    "mal_id": 1,
    "title": "Monster",
    "score": 9.16,
    "chapters": 162,
    "volumes": 18,
    "images": {
      "jpg": {
        "image_url": "https://cdn.myanimelist.net/images/manga/3/258224.jpg",
        "small_image_url": "https://cdn.myanimelist.net/images/manga/3/258224t.jpg",
        "large_image_url": "https://cdn.myanimelist.net/images/manga/3/258224l.jpg"
      },
      "webp": {
        "image_url": "https://cdn.myanimelist.net/images/manga/3/258224.webp",
        "small_image_url": "https://cdn.myanimelist.net/images/manga/3/258224t.webp",
        "large_image_url": "https://cdn.myanimelist.net/images/manga/3/258224l.webp"
      }
    }
  },
  {
    "mal_id": 147272,
    "title": "The Greatest Estate Developer",
    "score": 9.09,
    "chapters": 222,
    "volumes": null,
    "images": {
      "jpg": {
        "image_url": "https://cdn.myanimelist.net/images/manga/1/290131.jpg",
        "small_image_url": "https://cdn.myanimelist.net/images/manga/1/290131t.jpg",
        "large_image_url": "https://cdn.myanimelist.net/images/manga/1/290131l.jpg"
      },
      "webp": {
        "image_url": "https://cdn.myanimelist.net/images/manga/1/290131.webp",
        "small_image_url": "https://cdn.myanimelist.net/images/manga/1/290131t.webp",
        "large_image_url": "https://cdn.myanimelist.net/images/manga/1/290131l.webp"
      }
    }
  },
  {
    "mal_id": 642,
    "title": "Vinland Saga",
    "score": 9.09,
    "chapters": 224,
    "volumes": 29,
    "images": {
      "jpg": {
        "image_url": "https://cdn.myanimelist.net/images/manga/2/188925.jpg",
        "small_image_url": "https://cdn.myanimelist.net/images/manga/2/188925t.jpg",
        "large_image_url": "https://cdn.myanimelist.net/images/manga/2/188925l.jpg"
      },
      "webp": {
        "image_url": "https://cdn.myanimelist.net/images/manga/2/188925.webp",
        "small_image_url": "https://cdn.myanimelist.net/images/manga/2/188925t.webp",
        "large_image_url": "https://cdn.myanimelist.net/images/manga/2/188925l.webp"
      }
    }
  },
  {
    "mal_id": 51,
    "title": "Slam Dunk",
    "score": 9.09,
    "chapters": 276,
    "volumes": 31,
    "images": {
      "jpg": {
        "image_url": "https://cdn.myanimelist.net/images/manga/2/258749.jpg",
        "small_image_url": "https://cdn.myanimelist.net/images/manga/2/258749t.jpg",
        "large_image_url": "https://cdn.myanimelist.net/images/manga/2/258749l.jpg"
      },
      "webp": {
        "image_url": "https://cdn.myanimelist.net/images/manga/2/258749.webp",
        "small_image_url": "https://cdn.myanimelist.net/images/manga/2/258749t.webp",
        "large_image_url": "https://cdn.myanimelist.net/images/manga/2/258749l.webp"
      }
    }
  },
  {
    "mal_id": 143441,
    "title": "Omniscient Reader's Viewpoint",
    "score": 9.05,
    "chapters": 105,
    "volumes": 20,
    "images": {
      "jpg": {
        "image_url": "https://cdn.myanimelist.net/images/manga/1/265768.jpg",
        "small_image_url": "https://cdn.myanimelist.net/images/manga/1/265768t.jpg",
        "large_image_url": "https://cdn.myanimelist.net/images/manga/1/265768l.jpg"
      },
      "webp": {
        "image_url": "https://cdn.myanimelist.net/images/manga/1/265768.webp",
        "small_image_url": "https://cdn.myanimelist.net/images/manga/1/265768t.webp",
        "large_image_url": "https://cdn.myanimelist.net/images/manga/1/265768l.webp"
      }
    }
  },
  {
    "mal_id": 70345,
    "title": "Grand Blue",
    "score": 9.04,
    "chapters": null,
    "volumes": null,
    "images": {
      "jpg": {
        "image_url": "https://cdn.myanimelist.net/images/manga/2/166124.jpg",
        "small_image_url": "https://cdn.myanimelist.net/images/manga/2/166124t.jpg",
        "large_image_url": "https://cdn.myanimelist.net/images/manga/2/166124l.jpg"
      },
      "webp": {
        "image_url": "https://cdn.myanimelist.net/images/manga/2/166124.webp",
        "small_image_url": "https://cdn.myanimelist.net/images/manga/2/166124t.webp",
        "large_image_url": "https://cdn.myanimelist.net/images/manga/2/166124l.webp"
      }
    }
  },
  {
    "mal_id": 25,
    "title": "Fullmetal Alchemist",
    "score": 9.04,
    "chapters": 116,
    "volumes": 27,
    "images": {
      "jpg": {
        "image_url": "https://cdn.myanimelist.net/images/manga/3/243675.jpg",
        "small_image_url": "https://cdn.myanimelist.net/images/manga/3/243675t.jpg",
        "large_image_url": "https://cdn.myanimelist.net/images/manga/3/243675l.jpg"
      },
      "webp": {
        "image_url": "https://cdn.myanimelist.net/images/manga/3/243675.webp",
        "small_image_url": "https://cdn.myanimelist.net/images/manga/3/243675t.webp",
        "large_image_url": "https://cdn.myanimelist.net/images/manga/3/243675l.webp"
      }
    }
  }
]
