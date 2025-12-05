const connectDB = async () => {
  try {
    // Connect to MongoDB using mongoose
    await mongoose.connect("mongodb://127.0.0.1:27017/myDatabase");

    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
  }
};

// Call database connection function
connectDB();
