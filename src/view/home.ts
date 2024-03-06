import { Chessground } from 'chessground';
import { h, init, classModule } from 'snabbdom';
import { Ctrl } from '../ctrl';
import { Game, Renderer } from '../interfaces';
import OngoingGames from '../ongoingGames';
import { href } from '../routing';
import { get_random_position } from '../random_position';
export const renderHome: Renderer = ctrl => (ctrl.auth.me ? userHome(ctrl) : anonHome());

const patch = init([classModule]);
const searchParams = new URLSearchParams(window.location.search)
let position = get_random_position(searchParams.get('seed'), searchParams.get('oneset'))
let difficulty = 1
const playAI = (difficulty: number, ctrl: Ctrl) => 
  h(
    'button.btn.btn-outline-primary.btn-lg',
    {
      attrs: { type: 'button' },
      on: { click: () => ctrl.playAi(difficulty, position['fen']) },
    },
    'Play the Lichess AI (level ' + difficulty + ') from this position'
  )
const userHome = (ctrl: Ctrl) => {
  const playAINode = playAI(difficulty, ctrl)
  return [
  h('div', [
    renderRandomApp(),
    h('div.btn-group.mt-5', [
      playAINode,
      h(
        'button.btn.btn-outline-primary.btn-lg',
        {
          attrs: { type: 'button' },
          on: { click: () => {difficulty = (difficulty % 8) + 1; patch(playAINode, playAI(difficulty, ctrl));} },
        },
        'Harder AI'
      ),
      h(
        'button.btn.btn-outline-primary.btn-lg',
        {
          attrs: { type: 'button' },
          on: { click: () => ctrl.playMaia(position['fen'], 'maia1') },
        },
        'Play maia1 (rating ~1.4k)'
      ),
      h(
        'button.btn.btn-outline-primary.btn-lg',
        {
          attrs: { type: 'button' },
          on: { click: () => ctrl.playMaia(position['fen'], 'maia9') },
        },
        'Play maia9 (rating ~1.7k)'
      ),
      // h(
      //   'button.btn.btn-outline-primary.btn-lg',
      //   {
      //     attrs: { type: 'button' },
      //     on: { click: () => ctrl.playPool(10, 3) },
      //   },
      //   'Play an unrated 10+3 game with a random opponent'
      // ),
    ]),
    h('h2.mt-5', 'Games in progress'),
    h('div.games', renderGames(ctrl.games)),
  ]),
  ];
}

const renderGames = (ongoing: OngoingGames) =>
  ongoing.games.length ? ongoing.games.map(renderGameWidget) : [h('p', 'No ongoing games at the moment')];

const renderGameWidget = (game: Game) =>
  h(
    `a.game-widget.text-decoration-none.game-widget--${game.id}`,
    {
      attrs: href(`/game/${game.gameId}`),
    },
    [
      h('span.game-widget__opponent', [
        h('span.game-widget__opponent__name', game.opponent.username || 'Anon'),
        game.opponent.rating && h('span.game-widget__opponent__rating', game.opponent.rating),
      ]),
      h(
        'span.game-widget__board.cg-wrap',
        {
          hook: {
            insert(vnode) {
              const el = vnode.elm as HTMLElement;
              Chessground(el, {
                fen: game.fen,
                orientation: game.color,
                lastMove: game.lastMoveenderAbout().match(/.{1,2}/g),
                viewOnly: true,
                movable: { free: false },
                drawable: { visible: false },
                coordinates: false,
              });
            },
          },
        },
        'board'
      ),
    ]
  );

const anonHome = () => [
  h('div.login.text-center', [
    renderRandomApp(),
    h('div.big', [h('p', 'Please log in to play this position.')]),
    h(
      'a.btn.btn-primary.btn-lg.mt-5',
      {
        attrs: href('/login'),
      },
      'Login with Lichess'
    ),
  ]),
];
const renderPosition = (fen: string) => {
  return h('div', [
      h(
      'span.game-widget__board.cg-wrap.mt-5',
      {
        hook: {
          insert(vnode) {
            const el = vnode.elm as HTMLElement;
            Chessground(el, {
              fen: fen,
              orientation: 'white',
              viewOnly: true,
              coordinates: true,
            });
          },
        },
      },
      'board'
    ),

    h('p', 'White to move '),
    h('p', 'Position #' + position['seed']),
    h('samp', 'FEN: ' + fen),
    h('div', [
      h('a', {attrs: { href: 'https://lichess.org/analysis/standard/' + position['fen']}}, 'Analysis Board: https://lichess.org/analysis/standard/' + position['fen']),
    ])
  ]);
}
  const renderRandomApp = () => {
    const positionNode = renderPosition(position['fen'])
    return h('div', [
      positionNode,
      h('div.btn-group.mt-5', [
        h('button.btn.btn-outline-primary.btn-lg', {
          attrs: { type: 'button' },
          on: { click: () => {window.location.href = window.location.protocol + "//" + window.location.host + window.location.pathname + "?seed=" + position['seed']}}
        }, 'Link to this position'),
        h('button.btn.btn-outline-primary.btn-lg', {
          attrs: { type: 'button' },
          on: { click: () => {window.location.href = window.location.protocol + "//" + window.location.host + window.location.pathname}}
        }, 'New random position'),
       h('button.btn.btn-outline-primary.btn-lg', {
          attrs: { type: 'button' },
          on: { click: () => {window.location.href = window.location.protocol + "//" + window.location.host + window.location.pathname + '?oneset=true'}}
        }, 'New random position for one board'),
      ])
  ]);
  }