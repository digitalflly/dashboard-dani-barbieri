// ============================================================
// Funil Stories — sequências de stories (export manual do Meta
// Business Suite). O horário vem do ID de cada story, convertido
// para Brasília (o export grava no fuso do Pacífico).
// Para incluir uma sequência nova: acrescentar ao STORY_SEQS.
// ============================================================

export interface StoryItem {
  iso: string // 'YYYY-MM-DD HH:MM' (horário de Brasília)
  dur: number // segundos (0 = foto)
  views: number
  reach: number
  resp: number
  vis: number // visitas ao perfil
  clk: number // cliques no link
  shr: number
  link: string
}
export interface StorySeq {
  id: string // 'YYYY-MM-DD'
  name: string
  stories: StoryItem[]
}

export const STORY_SEQS: StorySeq[] = [
  {"id": "2026-11-04", "name": "Black Friday", "stories": [{"iso": "2026-11-04 11:59", "dur": 0, "views": 1204, "reach": 1036, "resp": 1, "vis": 6, "clk": 0, "shr": 0, "link": "https://www.instagram.com/stories/danibarbieribeauty/4023045194116683986"}, {"iso": "2026-11-04 12:18", "dur": 0, "views": 1015, "reach": 903, "resp": 0, "vis": 2, "clk": 0, "shr": 0, "link": "https://www.instagram.com/stories/danibarbieribeauty/4023054898955830727"}, {"iso": "2026-11-04 12:19", "dur": 0, "views": 1003, "reach": 876, "resp": 0, "vis": 1, "clk": 0, "shr": 0, "link": "https://www.instagram.com/stories/danibarbieribeauty/4023055056141564147"}, {"iso": "2026-11-04 12:24", "dur": 24, "views": 963, "reach": 840, "resp": 1, "vis": 0, "clk": 0, "shr": 0, "link": "https://www.instagram.com/stories/danibarbieribeauty/4023057697938792071"}, {"iso": "2026-11-04 12:30", "dur": 24, "views": 884, "reach": 781, "resp": 0, "vis": 3, "clk": 0, "shr": 0, "link": "https://www.instagram.com/stories/danibarbieribeauty/4023060494952363243"}, {"iso": "2026-11-04 12:48", "dur": 0, "views": 914, "reach": 750, "resp": 1, "vis": 0, "clk": 0, "shr": 0, "link": "https://www.instagram.com/stories/danibarbieribeauty/4023069814706213302"}, {"iso": "2026-11-04 12:48", "dur": 0, "views": 903, "reach": 720, "resp": 0, "vis": 0, "clk": 0, "shr": 0, "link": "https://www.instagram.com/stories/danibarbieribeauty/4023069866547767771"}, {"iso": "2026-11-04 13:11", "dur": 0, "views": 894, "reach": 704, "resp": 2, "vis": 1, "clk": 24, "shr": 2, "link": "https://www.instagram.com/stories/danibarbieribeauty/4023081583000612683"}]},
  {"id": "2026-11-09", "name": "Consultoria", "stories": [{"iso": "2026-11-09 16:30", "dur": 20, "views": 760, "reach": 595, "resp": 1, "vis": 1, "clk": 0, "shr": 0, "link": "https://www.instagram.com/stories/danibarbieribeauty/4026805276073670519"}, {"iso": "2026-11-09 16:30", "dur": 0, "views": 655, "reach": 579, "resp": 0, "vis": 0, "clk": 0, "shr": 0, "link": "https://www.instagram.com/stories/danibarbieribeauty/4026805415234367081"}, {"iso": "2026-11-09 16:31", "dur": 0, "views": 628, "reach": 557, "resp": 0, "vis": 1, "clk": 0, "shr": 0, "link": "https://www.instagram.com/stories/danibarbieribeauty/4026805768453613039"}, {"iso": "2026-11-09 16:31", "dur": 0, "views": 629, "reach": 543, "resp": 0, "vis": 1, "clk": 0, "shr": 0, "link": "https://www.instagram.com/stories/danibarbieribeauty/4026806025933302586"}, {"iso": "2026-11-09 16:32", "dur": 20, "views": 574, "reach": 512, "resp": 0, "vis": 0, "clk": 0, "shr": 0, "link": "https://www.instagram.com/stories/danibarbieribeauty/4026806545748259706"}, {"iso": "2026-11-09 16:57", "dur": 0, "views": 549, "reach": 476, "resp": 0, "vis": 2, "clk": 1, "shr": 0, "link": "https://www.instagram.com/stories/danibarbieribeauty/4026818858213668393"}]},
  {"id": "2026-11-17", "name": "Elevation", "stories": [{"iso": "2026-11-17 10:30", "dur": 20, "views": 1443, "reach": 1242, "resp": 5, "vis": 13, "clk": 0, "shr": 1, "link": "https://www.instagram.com/stories/danibarbieribeauty/4032422517662188609"}]},
  {"id": "2026-11-25", "name": "Black Friday", "stories": [{"iso": "2026-11-25 11:17", "dur": 0, "views": 837, "reach": 706, "resp": 0, "vis": 2, "clk": 0, "shr": 0, "link": "https://www.instagram.com/stories/danibarbieribeauty/4038244053228482364"}, {"iso": "2026-11-25 11:17", "dur": 0, "views": 768, "reach": 671, "resp": 1, "vis": 0, "clk": 0, "shr": 0, "link": "https://www.instagram.com/stories/danibarbieribeauty/4038244152054689639"}, {"iso": "2026-11-25 11:18", "dur": 20, "views": 707, "reach": 653, "resp": 0, "vis": 1, "clk": 0, "shr": 0, "link": "https://www.instagram.com/stories/danibarbieribeauty/4038244697985499845"}, {"iso": "2026-11-25 11:19", "dur": 0, "views": 676, "reach": 619, "resp": 0, "vis": 0, "clk": 0, "shr": 0, "link": "https://www.instagram.com/stories/danibarbieribeauty/4038245396680878343"}, {"iso": "2026-11-25 11:20", "dur": 0, "views": 656, "reach": 593, "resp": 0, "vis": 0, "clk": 0, "shr": 0, "link": "https://www.instagram.com/stories/danibarbieribeauty/4038245771072800091"}, {"iso": "2026-11-25 11:21", "dur": 0, "views": 652, "reach": 577, "resp": 1, "vis": 0, "clk": 0, "shr": 0, "link": "https://www.instagram.com/stories/danibarbieribeauty/4038246034659785272"}, {"iso": "2026-11-25 11:21", "dur": 0, "views": 624, "reach": 557, "resp": 0, "vis": 0, "clk": 0, "shr": 0, "link": "https://www.instagram.com/stories/danibarbieribeauty/4038246140045714949"}, {"iso": "2026-11-25 11:22", "dur": 20, "views": 597, "reach": 537, "resp": 0, "vis": 1, "clk": 0, "shr": 0, "link": "https://www.instagram.com/stories/danibarbieribeauty/4038246717408665869"}, {"iso": "2026-11-25 11:22", "dur": 0, "views": 578, "reach": 530, "resp": 0, "vis": 0, "clk": 0, "shr": 0, "link": "https://www.instagram.com/stories/danibarbieribeauty/4038246855526878167"}, {"iso": "2026-11-25 11:22", "dur": 0, "views": 554, "reach": 517, "resp": 0, "vis": 1, "clk": 0, "shr": 0, "link": "https://www.instagram.com/stories/danibarbieribeauty/4038246896228458050"}, {"iso": "2026-11-25 11:22", "dur": 0, "views": 552, "reach": 515, "resp": 0, "vis": 0, "clk": 0, "shr": 0, "link": "https://www.instagram.com/stories/danibarbieribeauty/4038246938180046556"}, {"iso": "2026-11-25 11:23", "dur": 20, "views": 568, "reach": 511, "resp": 0, "vis": 8, "clk": 4, "shr": 1, "link": "https://www.instagram.com/stories/danibarbieribeauty/4038247428863154490"}]},
]

// resultados comerciais informados manualmente, por sequência (id 'YYYY-MM-DD').
// null = a preencher. agendamentos = nomes de quem agendou (a contagem é o tamanho
// da lista; os nomes aparecem no tooltip do indicador).
export interface StoryResult {
  conversas: number | null
  agendamentos: string[] | null
}
export const STORY_RESULTS: Record<string, StoryResult> = {
  '2026-11-17': { conversas: null, agendamentos: ['Gabriela'] },
  '2026-11-25': { conversas: null, agendamentos: ['Giovanna'] },
}
