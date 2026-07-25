import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyC8Ec0v70tMMF-juSsLcoc07HJOqUquYgo",
  authDomain: "physics-lab-discussion.firebaseapp.com",
  databaseURL: "https://physics-lab-discussion-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "physics-lab-discussion",
  storageBucket: "physics-lab-discussion.firebasestorage.app",
  messagingSenderId: "618795560110",
  appId: "1:618795560110:web:e94c3d67750b8a87fbd13f",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

window.firebaseApp = app;
window.db = db;

export { app, db };
