// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyBAD6ShMPzY2vE_aSs6R3f8BiANMVGw5k0",
    authDomain: "shimi-gem.firebaseapp.com",
    databaseURL: "https://shimi-gem-default-rtdb.firebaseio.com",
    projectId: "shimi-gem",
    storageBucket: "shimi-gem.firebasestorage.app",
    messagingSenderId: "102001010471",
    appId: "1:102001010471:web:58e2faf4b6793d7ac32b02",
    measurementId: "G-1QXKEFKS3G"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
