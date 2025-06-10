const request = require("supertest");
const app = require("./app"); 

//Test route get /games/game/:code
it("GET /games/game/MOXHF", async () => {
  const res = await request(app).get("/games/game/MOXHF");

  expect(res.statusCode).toBe(200);
  expect(res.body.game).toEqual({
    _id: "68348d6f83f06f5e3751e371",
    status: true,
    code: "MOXHF",
    title: "Ville",
    image:
      "https://res.cloudinary.com/dxgix5q4e/image/upload/v1747834158/science-fiction_gniu4v.png",
    genre: "Action",
    nbPlayers: 3,
    nbScenes: 8,
    winner: null,
    usersId: ["682d9a48b818070dd37cdd60"],
    __v: 0,
  });
});

//Route de récupération des parties d'un utilisateur via le token
it("GET games/user/aYp-fAr95IiiRX5NJNnC1qx3m9BNfDFF", async () => {
  const res = await request(app).get(
    "/games/user/aYp-fAr95IiiRX5NJNnC1qx3m9BNfDFF"
  );

  expect(res.statusCode).toBe(200);
  expect(res.body.games).toEqual(
    expect.arrayContaining([
      {
        _id: "68348af699126e91d97b0a12",
        status: true,
        code: "WCQHY",
        title: "John",
        image:
          "https://res.cloudinary.com/dxgix5q4e/image/upload/v1747834158/chapeau-de-cowboy_d1bafb.png",
        genre: "Aventure",
        nbPlayers: 4,
        nbScenes: 12,
        winner: null,
        usersId: [
          {
            _id: "68345d3c25a8496e9ff5d87b",
            email: "lion@gmail.com",
            token: "aYp-fAr95IiiRX5NJNnC1qx3m9BNfDFF",
            password:
              "$2b$10$RWUjncJWMaLc7HN4g8u..ONXXPLomVt190RR2G7JK725.9gHfWsPK",
            nickname: "Lion",
            avatar:
              "https://res.cloudinary.com/dxgix5q4e/image/upload/v1747751160/witch_mt3j0o.png",
            __v: 0,
          },
        ],
        __v: 0,
      },
    ])
  );
});

//test route get scenes/code/:code/scene/:sceneNumber"
it("GET /scenes/code/HzeHA/scene/1", async () => {
  const res = await request(app).get("/scenes/code/HzeHA/scene/1");
  expect(res.statusCode).toBe(200);

  expect(res.body.data).toEqual({
    "_id": "68346c91269c3811ad8c2333",
    "game": "68346c8e269c3811ad8c232c",
    "status": false,
    "sceneNumber": 1,
    "text": "Vous êtes Barnabé, champion du monde (autoproclamé) de la fabrication de gâteaux au yaourt. Votre secret ?  Un soupçon de folie et beaucoup, beaucoup de yaourt périmé.  Aujourd’hui, c’est le grand jour : la finale du concours annuel de pâtisserie de la ville de Pâtisserie-sur-Loire !  Votre rival, le sinistre Gaston, un pâtissier au regard vide et aux gâteaux insipides, vous fixe d'un air menaçant.  Sa spécialité ? Les gâteaux aux algues. Oui, vous avez bien lu.  \n\nVotre chariot, surchargé de vos chefs-d'œuvre légèrement douteux – un gâteau au yaourt arc-en-ciel qui semble avoir vu des choses, un volcan de yaourt qui menace d'éruption et un cupcake au yaourt géant décoré d'une figurine de votre chat, Mittens, qui ressemble étrangement à un alien –  est enfin arrivé devant le jury.  Madame Dubois, présidente du jury et réputée pour son goût particulièrement… exigeant, vous observe avec un mélange de curiosité et de terreur.  \n\nSoudain, un cri strident retentit.  Gaston, pâle comme un fantôme, pointe un doigt tremblant vers votre cupcake géant.  \"La figurine… elle bouge !\"\n\nMittens, ou ce qui lui ressemble, lève une patte velue...  Mais que va-t-il se passer ?\n",
    "voteWinner": null,
    "propositions": [
      {
        "text": "TEST PROPOSITION ",
        "votes": 0,
        "_id": "68346cac269c3811ad8c2339"
      }
    ],
    "__v": 0
  });
});

// test route get scenes/:code;
it("GET /scenes/FVOOT", async () => {
  const res = await request(app).get("/scenes/FVOOT");
  expect(res.statusCode).toBe(200);

  expect(res.body).toMatchObject({
    result: true,
    scenes: [
      {
        sceneNumber: 1,
        status: false,
        text: expect.stringContaining("La vapeur du café"),
        voteWinner: null,
        propositions: [],
      }
    ]
  });
});



