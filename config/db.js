import { MongoClient, ServerApiVersion } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

// Construct MongoDB URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_CLUSTER}/${process.env.DB_NAME}?retryWrites=true&w=majority&appName=Cluster0`;

// Create MongoDB client
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db;

// Connect to MongoDB
export const connectDB = async () => {
  try {
    await client.connect();
    db = client.db(process.env.DB_NAME);
    console.log("✅ Successfully connected to MongoDB!");
    console.log(`📦 Database: ${process.env.DB_NAME}`);

    // Verify connection
    await db.command({ ping: 1 });
    console.log("✅ Database connection verified!");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    console.error("💡 Check your credentials and network access");
    process.exit(1);
  }
};

// Get database instance
export const getDB = () => {
  if (!db) {
    throw new Error("Database not initialized. Call connectDB first.");
  }
  return db;
};

// Get all collections - THIS WAS MISSING!
export const getCollections = () => {
  const database = getDB();
  return {
    users: database.collection("users"),
    tickets: database.collection("tickets"),
    bookings: database.collection("bookings"),
    transactions: database.collection("transactions"),
  };
};

export { client };
