document.addEventListener("DOMContentLoaded", () => {

    // --- DOM Elemente ---
    const startBtn = document.getElementById("startGame");
    const playerCountInput = document.getElementById("playerCount");
    const setupDiv = document.getElementById("setup");
    const nameInputsDiv = document.getElementById("nameInputs");
    const gameDiv = document.getElementById("game");
    const playersDiv = document.getElementById("players");
    const addRoundBtn = document.getElementById("addRound");
    const saveGameBtn = document.getElementById("saveGame");
    const resetGameBtn = document.getElementById("resetGame");

    // Zentraler Numpad Container
    let numpadDiv = document.getElementById("numpad");
    if (!numpadDiv) {
        numpadDiv = document.createElement("div");
        numpadDiv.id = "numpad";
        numpadDiv.style.marginTop = "15px";
        gameDiv.appendChild(numpadDiv);
    }

    // Buttons Container am Ende
    const buttonsContainer = document.createElement("div");
    buttonsContainer.style.marginTop = "20px";
    buttonsContainer.style.display = "flex";
    buttonsContainer.style.justifyContent = "space-around";
    buttonsContainer.style.flexWrap = "wrap";
    gameDiv.appendChild(buttonsContainer);

    // Buttons ins Container verschieben
    buttonsContainer.appendChild(addRoundBtn);
    buttonsContainer.appendChild(saveGameBtn);
    buttonsContainer.appendChild(resetGameBtn);

    // Schnellstart-Knopf für Kathi & Tim
    const kathiTimBtn = document.createElement("button");
    kathiTimBtn.textContent = "Schnellstart: Kathi & Tim";
    setupDiv.prepend(kathiTimBtn);

    // Endstand und History Divs
    let endstandDiv = document.getElementById("endstand") || document.createElement("div");
    endstandDiv.id = "endstand";
    gameDiv.appendChild(endstandDiv);

    let historyDiv = document.getElementById("history") || document.createElement("div");
    historyDiv.id = "history";
    gameDiv.appendChild(historyDiv);

    // --- Spielzustand ---
    let players = [];
    let rounds = [];
    let gameOver = false;
    let activeInputIndex = 0; // Index des aktuell aktiven Spielerfeldes

    // --- Schnellstart Kathi & Tim ---
    kathiTimBtn.onclick = () => {
        players = [
            { name: "Kathi", score: 0 },
            { name: "Tim", score: 0 }
        ];
        startGameUI();
    };

    // --- Start / Namenseingabe ---
    startBtn.onclick = () => {
        if (!nameInputsDiv.children.length) {
            // Spieleranzahl wählen → Eingabefelder erzeugen
            const count = Number(playerCountInput.value);
            if (count < 2 || count > 8) {
                alert("Bitte wähle 2 bis 8 Spieler.");
                return;
            }
            nameInputsDiv.innerHTML = "";
            for (let i = 0; i < count; i++) {
                const input = document.createElement("input");
                input.placeholder = `Name Spieler ${i + 1}`;
                nameInputsDiv.appendChild(input);
                nameInputsDiv.appendChild(document.createElement("br"));
            }
            startBtn.textContent = "Spiel starten";
        } else {
            // Namen aus Eingabefeldern übernehmen
            players = [...nameInputsDiv.querySelectorAll("input")].map((i, idx) => ({
                name: i.value.trim() || `Spieler ${idx + 1}`,
                score: 0
            }));
            startGameUI();
        }
    };

    // --- Gemeinsame Routine für Spielstart ---
    function startGameUI() {
        rounds = [];
        gameOver = false;
        activeInputIndex = 0;
        setupDiv.style.display = "none";
        gameDiv.style.display = "block";
        endstandDiv.innerHTML = "";
        historyDiv.innerHTML = "";
        nameInputsDiv.innerHTML = "";
        startBtn.textContent = "Neues Spiel";
        renderPlayers();
        renderHistory();
    }

    // --- Spielerfelder rendern ---
    function renderPlayers() {
    playersDiv.innerHTML="";
    players.forEach((p,i)=>{
        const div=document.createElement("div");
        div.className="player";
        div.innerHTML=`<strong>${p.name}</strong><br>
            Gesamtpunkte: <span style="font-weight:bold;font-size:1.5em">${p.score}</span><br>
            <input class="playerInput" readonly>`;
        playersDiv.appendChild(div);
    });

    renderNumpad();

    const inputs = Array.from(document.querySelectorAll(".playerInput"));

    // Aktives Feld visuell markieren
    function highlightActive() {
        inputs.forEach((inp, idx)=>{
            inp.style.border="1px solid #ccc"; 
            inp.style.backgroundColor="#fff";
            if(idx===activeInputIndex){
                inp.style.border="2px solid #4caf50";
                inp.style.backgroundColor="#e0ffe0";
            }
        });
    }

    highlightActive();

    // Felder anklickbar machen
    inputs.forEach((input, idx)=>{
        input.addEventListener("focus", ()=>{ 
            activeInputIndex = idx; 
            highlightActive(); 
        });
        input.addEventListener("mousedown", ()=>{ 
            activeInputIndex = idx; 
            highlightActive(); 
        });
        input.addEventListener("touchstart", ()=>{ 
            activeInputIndex = idx; 
            highlightActive(); 
        });
    });
}


    // --- Numpad rendern ---
    function renderNumpad() {
        numpadDiv.innerHTML = "";
        const layout = [["1","2","3"],["4","5","6"],["7","8","9"],["0","⌫","↵"]];
        const inputs = Array.from(document.querySelectorAll(".playerInput"));

        layout.forEach(row => {
            const r = document.createElement("div");
            r.style.display = "flex";
            r.style.marginBottom = "5px";

            row.forEach(val => {
                const b = document.createElement("button");
                b.textContent = val;
                b.style.flex = "1";
                b.style.margin = "2px";
                b.style.fontSize = "1.2em";
                b.onclick = () => handleNumpad(val, inputs);
                r.appendChild(b);
            });
            numpadDiv.appendChild(r);
        });

        // Fokus auf ersten Spieler
        if(inputs.length > 0) {
            activeInputIndex = 0;
            inputs[activeInputIndex].focus();
        }
    }

    // --- Numpad Logik mit Enter → nächste Runde ---
    function handleNumpad(val, inputs) {
        if(gameOver) return;
        const input = inputs[activeInputIndex];

        if(val === "⌫") {
            input.value = input.value.slice(0, -1);
        }
        else if(val === "↵") {
            // Enter → nächster Spieler oder Runde addieren
            if(activeInputIndex < inputs.length - 1) activeInputIndex++;
            else {
                addRound(); // Punkte addieren
                activeInputIndex = 0; // Eingabe wieder bei Spieler 1
            }
            inputs[activeInputIndex].focus();
        }
        else {
            input.value += val;
        }
    }

    // --- Runde hinzufügen ---
    function addRound() {
        const inputs = Array.from(document.querySelectorAll(".playerInput"));
        const roundPoints = [];

        inputs.forEach((input, i) => {
            const pts = Number(input.value) || 0;
            players[i].score += pts;
            roundPoints.push({ name: players[i].name, points: pts });
            input.value = "";
        });

        rounds.push(roundPoints);

        // Spielerfelder neu rendern + Fokus auf aktuellen Spieler
        renderPlayers();
        const newInputs = Array.from(document.querySelectorAll(".playerInput"));
        newInputs[activeInputIndex].focus();

        renderHistory();
        checkWinner();
    }

    // --- Rundenhistorie anzeigen ---
    function renderHistory() {
        historyDiv.innerHTML = "<h3>Rundenhistorie</h3>";
        [...rounds].reverse().forEach(r => {
            const d = document.createElement("div");
            d.textContent = r.map(p => `${p.name}: ${p.points}`).join(" | ");
            historyDiv.appendChild(d);
        });
    }

    // --- Gewinner prüfen ---
    function checkWinner() {
        const winner = players.find(p => p.score >= 6000);
        if(!winner) return;
        gameOver = true;
        const ranking = [...players].sort((a,b)=>b.score-a.score)
            .map(p => `${p.name}: ${p.score}`).join("\n");
        alert(`🏆 Gewinner:\n${ranking}`);
    }

    // --- Spiel speichern ---
    saveGameBtn.onclick = () => {
        localStorage.setItem("tuttoGame", JSON.stringify({players, rounds}));
        alert("Spiel gespeichert 💾");
    };

    // --- Spiel zurücksetzen ---
    resetGameBtn.onclick = () => {
        localStorage.removeItem("tuttoGame");
        players = [];
        rounds = [];
        gameOver = false;
        activeInputIndex = 0;
        playersDiv.innerHTML = "";
        historyDiv.innerHTML = "";
        endstandDiv.innerHTML = "";
        nameInputsDiv.innerHTML = "";
        setupDiv.style.display = "block";
        gameDiv.style.display = "none";
        startBtn.textContent = "Neues Spiel";
        numpadDiv.innerHTML = "";
    };

});
