const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.get('/status', (request, response) => response.json({clients: clients.length}));

const PORT = process.env.PORT || 80;

let clients = [];
let facts = [];

// Define the top 10 cryptocurrencies
const cryptocurrencies = [
  'Bitcoin',
  'Ethereum',
  'Binance Coin',
  'Cardano',
  'Solana',
  'XRP',
  'Polkadot',
  'Dogecoin',
  'Avalanche',
  'Chainlink'
];

app.listen(PORT, () => {
  console.log(`Facts Events service listening at http://localhost:${PORT}`)
})

function eventsHandler(request, response, next) {
  console.log("eventsHandler: " + JSON.stringify(request.headers));
  const headers = {
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache'
  };
  response.writeHead(200, headers);

  const data = `data: ${JSON.stringify(facts)}\n\n`;

  response.write(data);

  const clientId = Date.now();

  const newClient = {
    id: clientId,
    response
  };

  clients.push(newClient);

  request.on('close', () => {
    console.log(`${clientId} Connection closed`);
    clients = clients.filter(client => client.id !== clientId);
  });
}

app.get('/events', eventsHandler);

// ...

function sendEventsToAll(newPrice) {
  clients.forEach(client => client.response.write(`data: ${JSON.stringify(newPrice)}\n\n`))
}

async function addFact(request, respsonse, next) {
  const newFact = request.body;
  facts.push(newFact);
  respsonse.json(newFact)
  return sendEventsToAll(newFact);
}

app.post('/fact', addFact);




// Create an initial array with random prices
let prices = cryptocurrencies.map(coin => ({
  name: coin,
  price: (Math.random() * 100000).toFixed(2),
  status: ''
}));

// Function to randomly update the price of one of the cryptocurrencies
const updateRandomCryptoPrice = () => {
  const randomIndex = Math.floor(Math.random() * prices.length);
  const randomPrice = (Math.random() * 100000).toFixed(2);
  prices[randomIndex].price = randomPrice;
  sendEventsToAll(prices[randomIndex]);
};

// Update a random cryptocurrency's price every second
setInterval(updateRandomCryptoPrice, 1000);

app.get('/cryptocurrencies', (req, res) => {
  res.json(prices);
});
