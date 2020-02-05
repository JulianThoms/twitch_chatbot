const twitchjs = require('twitch-js');
const pg = require("pg");

const CON_STRING = process.env.DB_CON_STRING || "postgres://lqkivzqdzcaalr:78e9f45f9f4195a0fa11636e58447dd83ef914c0626af5ef55c12177af0e1c5b@ec2-54-75-235-28.eu-west-1.compute.amazonaws.com:5432/dc0kk7vjlc3fti";
if (CON_STRING == undefined) {
  console.log("Error: Environment variable DB_CON_STRING not set!");
  process.exit(1);
}
pg.defaults.ssl = true;
const dbClient = new pg.Client(CON_STRING);
dbClient.connect();

const options = {
  options: {
    debug: true,
  },
  connection: {
    cluster: 'aws',
    reconnect: true,
  },
  identity: {
    username: 'pykemainbot',
    password: 'oauth:xql3fk7mj2rucd07baxuxnx2h294xp',
  },
  channels: ['shunpaw'],
};

const client = new twitchjs.client(options);

client.connect();

client.on('connected', (address, port) => {
  client.action('shunpaw', 'Connected!');
});

client.on('chat', (channel, user, message, self) => {
  name = user['display-name'];
  if (message === "!test"){
    client.action('shunpaw', "!test");
  }
  if (message === '!hello'){
    client.action('shunpaw', `Hello ${name} !`);
  }

  if (message === '!register'){
    dbClient.query("SELECT * FROM users_twitch WHERE name = $1", [name], function(err, res){
      if(res != undefined && res.rows.length == 0){
        dbClient.query('INSERT INTO users_twitch(name, points) VALUES($1, 10000)', [name], function(errAdd, resAdd){
          if(!errAdd)
            console.log("added");
        })
      }
      dbClient.query("UPDATE users_twitch SET points = $1 WHERE name = $2", [10000, name], function(err, res){});

    })
  }

  if (message === '!roulette'){
    dbClient.query("SELECT * FROM users_twitch WHERE name = $1", [name], function(err, res){
      if(res != undefined && res.rows.length == 1){
        let points = res.rows[0].points;
        let newPoints = roulette(points);
        dbClient.query("UPDATE users_twitch SET points = $1 WHERE name = $2", [newPoints, name], function(err, res){
          if(newPoints > points){
            client.action('shunpaw', `Yeehaw ${name} ! You won! You now have ${newPoints} Points!`);
          }
          else if (newPoints == points){
            client.action('shunpaw', `Pfew, ${name} ! Nothing happened! You still have ${newPoints} Points.`);
          }
          else if (newPoints < points*2+1){
            client.action('shunpaw', `Aw man... Sorry ${name}. You lost all your Points!`);
          }
          else{
            client.action('shunpaw', `Jackpot ${name}! You now have ${newPoints} Points!`)
          }
        });
      }
    });
  }
});

function roulette(points){
  let decider = Math.random() * 10;
  if(decider < 2){
    return 0;
  }
  else if (decider < 5){
    return points;
  }
  else if (decider < 8){
    return (points + (points / 10) + 500);
  }
  else {
    if(points < 5000){
      return (10000);
    }
    return (points + points + 1);
  }
}
