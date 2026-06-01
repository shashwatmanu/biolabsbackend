const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI is not set in environment variables!");
  process.exit(1);
}

const SubscriberSchema = new mongoose.Schema({}, { strict: false });
const Subscriber = mongoose.model('subscribers', SubscriberSchema);

const OrderSchema = new mongoose.Schema({}, { strict: false });
const Order = mongoose.model('orders', OrderSchema);

async function cleanUp() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB for clean-up...");

    // Delete test subscriber
    const subResult = await Subscriber.deleteOne({ email: "test_temp_subscriber@biolabs.com" });
    console.log(`Deleted test subscribers: ${subResult.deletedCount}`);

    // Delete test order
    const orderResult = await Order.deleteOne({ "guestDetails.email": "test_temp_customer@biolabs.com" });
    console.log(`Deleted test orders: ${orderResult.deletedCount}`);

  } catch (err) {
    console.error("Clean-up error:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.");
  }
}

cleanUp();
