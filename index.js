const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const port = process.env.API_PORT || 5710;

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Compusource API Server is running");
});

// Microsoft Teams Webhook

const axios = require("axios");

/*
    1- In Microsoft Teams, choose More options (⋯) next to the channel name and then choose Connectors.
    2- Scroll through the list of Connectors to Incoming Webhook, and choose Add.
    3- Enter a name for the webhook, upload an image to associate with data from the webhook, and choose Create.
    4- Replace the webhook URL into this variable.
*/
const webhookURL =
  "https://compsourceeng.webhook.office.com/webhookb2/41c3f714-5063-4c1e-a3f3-2987d39604ff@9daebd7e-3d1c-4c8d-9a23-0f8875b2d2fb/IncomingWebhook/";

// this card can be created via https://amdesigner.azurewebsites.net/ then replace the JSON payload into this variable.

let card = {};

const teamsNotify = async () => {
  try {
    const res = await axios.post(webhookURL, {
      type: "message",
      attachments: [
        {
          contentType: "application/vnd.microsoft.card.adaptive",
          contentUrl: null,
          content: card,
        },
      ],
    });
    console.log(res.status, res.statusText, res.data);
  } catch (error) {
    console.error(
      error.response.status,
      error.response.statusText,
      error.response.data
    );
  }
};

// -----------------

// MongoDB connection

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pwfe9mm.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const dbName = process.env.DB_NAME;
    const colName = client.db(dbName).collection("smscollection");

    app.post("/webhook", async (req, res) => {
      const data = req.body;
      const from = data.data.payload.from.phone_number;
      const textMessage = data.data.payload.text;
      const to = data.data.payload.to[0].phone_number;

      const smsData = {
        from,
        to,
        textMessage,
      };

      const result = await colName.insertOne(smsData);
      card = {
        $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
        type: "AdaptiveCard",
        version: "1.0",
        body: [
          {
            type: "Container",
            id: "90ca08d2-f2a3-70bb-715f-883f60bd8c63",
            padding: "None",
            items: [
              {
                type: "Container",
                id: "2b5cbc26-b1ae-237a-aa7b-d99c2b9eabcd",
                padding: "None",
                items: [
                  {
                    type: "TextBlock",
                    id: "480984fe-37f0-68a5-d757-318cc1292d11",
                    text: `You have received a SMS from ${from}`,
                    wrap: true,
                    size: "Medium",
                    weight: "Bolder",
                    color: "Good",
                  },
                ],
              },
              {
                type: "TextBlock",
                id: "72c5f067-eff7-9ea0-03e0-2682897d82c6",
                text: "Message:",
                wrap: true,
                size: "Large",
                color: "Accent",
              },
              {
                type: "Container",
                id: "c46af02c-48ed-e243-d83f-29d684ddbb82",
                padding: "None",
                items: [
                  {
                    type: "TextBlock",
                    id: "15f389aa-05ab-4446-57d3-dca4f28805c2",
                    text: `${textMessage}`,
                    wrap: true,
                    color: "Accent",
                    size: "ExtraLarge",
                    horizontalAlignment: "Left",
                    spacing: "Medium",
                  },
                ],
              },
              {
                type: "Container",
                id: "1580703e-4579-239e-2e72-d7b941900c39",
                padding: "None",
                items: [
                  {
                    type: "TextBlock",
                    id: "133092ea-4cae-66f3-5c2d-9c7cbba559db",
                    text: `Recieved on: ${to}`,
                    wrap: true,
                    size: "Small",
                  },
                  {
                    type: "ActionSet",
                    id: "b3c26ada-95f0-2018-5b64-c93467311cdf",
                    actions: [
                      {
                        type: "Action.OpenUrl",
                        id: "85a5964e-18bf-aa23-5b70-1dbde5c5a19b",
                        title: "Go to SMS Portal",
                        url: "https://smsapp-cs.surge.sh/",
                        style: "positive",
                        isPrimary: true,
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
        padding: "ExtraLarge",
      };

      teamsNotify();
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`API server is running on ${port}`);
});
