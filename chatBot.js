require("dotenv").config();
const tmi = require("tmi.js");
const raidMessage = "moose turds";
let raiding = false;
const mariadb = require("mariadb");

const pool = mariadb.createPool({
  host: "localhost",
  user: "admin",
  password: "admin",
  database: "users",
  connectionLimit: 10,
});

const nerds = []

let userInDbArr = [];
let userNotInDbArr = [];
let userInDb='UPDATE users SET raids = CASE';
let userNotInDb='INSERT INTO users (username, toonies, tickets, raids) VALUES '

// const client = new tmi.Client({
// 	channels: [ 'abootgaming','xinfinite0' ]
// });

const client = new tmi.Client({
  options: { debug: true },
  identity: {
    username: "abootgaming",
    password: process.env.T_PASS,
  },
  channels: ["abootgaming"],
});

client.connect();
client.on("message", (channel, tags, message, self) => {
  // if (message === "!startraid") {
  //   console.log("THE RAID BOT HAS STARTED!");
  //   client.say(channel, `We are raiding!! Join in to earn toonies and tickets for giveaways!!!`);
  //   console.log(client.opts.channels);
  //   console.log(message.join(" "));
  //   raiding = true;
  // }

    if (message.includes("!startraid") && tags.username === "abootgaming") {
    const msgArr = message.split(" ");
    console.log("THE RAID BOT HAS STARTED!");
    client.say(channel, `We are raiding!! Join in to earn toonies and tickets for giveaways!!!`);
    console.log(client.opts.channels.push(`#${msgArr[1]}`));
    console.log(client.opts.channels);
    raiding = true;
    client.disconnect().then(res =>client.connect())
  }

  if (message === "!raidover") {
    console.log("Finishing Raid And Adding Points!");
    raiding = false;
    loopNerds();
  }

  // if (message.toLowerCase().includes(raidMessage) && raiding) {
  //   if (!nerds[tags["display-name"]]) {
  //     nerds[tags["display-name"]] = { points: 5 };
  //   } else {
  //     nerds[tags["display-name"]].points += 5;
  //   }
  // }
  if (message.toLowerCase().includes(raidMessage) && raiding && channel !== '#abootgaming'&& !nerds.includes(tags["display-name"])) {
    nerds.push(tags["display-name"])
  }


  if (message === "!test") {
  }

  if (message === "!talk") {
    client.say(channel, `@${tags.username}, heya!`);
  }
});


const loopNerds = async() => {
    for(const nerd of nerds) {
      await checkUser(nerd)
      .catch(err => {
        console.log(`ERROR IN LOOP: ${err}`);
      })
    }
    userInDb += ` ELSE toonies END`
    userNotInDb = userNotInDb.replace(/,\s*$/, "")

    if(userInDbArr.length){
      await giveDbUserPoints()
      userInDbArr = []
    }
    if(userNotInDbArr.length) {
      await insertIntoDb()
      userNotInDbArr = []
    }

};

const giveDbUserPoints = async() => {
  let conn;
  try {
    conn = await pool.getConnection();
    const givingPoints = await conn.query(userInDb)
  } catch (error) {

  } finally {
  console.log("Closing connection (giving points)");
	if (conn) return conn.end();
  }
}

const insertIntoDb = async() => {
  let conn;
  try {
    conn = await pool.getConnection();
    const enterIntoDb = await conn.query(userNotInDb)
  } catch (error) {

  } finally {
    console.log("Closing connection (insert)");
    if (conn) return conn.end();
  }
}

const checkUser = async(user) => {
  console.log(user);
  let conn;
try {
  conn = await pool.getConnection();
  const res = await conn.query(`
  SELECT * FROM users WHERE username = '${user}'
  `)

  if(res[0]) {

    userInDbArr.push(user)
    userInDb += ` WHEN username = '${user}' THEN raids + 1`
  } else {
    userNotInDbArr.push(user)
    userNotInDb += `('${user}', 50, 0, 1), `
  }

} catch (error) {

} finally {
  console.log("Closing connection (Checking Users)");
	if (conn) return conn.end();
  }
};
