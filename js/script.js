console.log('Lets write JavaScript');
let currentSong = new Audio();
let songs = [];
let currFolder;

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

async function getSongs(folder) {
    currFolder = folder;
    try {
        let a = await fetch(`/${folder}/`);
        let response = await a.text();
        let div = document.createElement("div");
        div.innerHTML = response;
        let as = div.getElementsByTagName("a");
        songs = [];

        for (let index = 0; index < as.length; index++) {
            const element = as[index];
            if (element.href.endsWith(".mp3")) {
                songs.push(decodeURIComponent(element.href.split(`/${folder}/`)[1]));
            }
        }

        // Show all the songs
        let songUL = document.querySelector(".songList ul");
        songUL.innerHTML = "";
        for (const song of songs) {
            songUL.innerHTML += `<li><img class="invert" width="34" src="img/music.svg" alt="">
                <div class="info">
                    <div>${song.replaceAll("%20", " ")}</div>
                    <div>Harry</div>
                </div>
                <div class="playnow">
                    <span>Play Now</span>
                    <img class="invert" src="img/play.svg" alt="">
                </div> </li>`;
        }

        // Click listeners
        Array.from(document.querySelectorAll(".songList li")).forEach(e => {
            e.addEventListener("click", () => {
                playMusic(e.querySelector(".info div").innerText.trim());
            });
        });

    } catch (err) {
        console.error("Error fetching songs:", err);
    }

    return songs;
}

const playMusic = (track, pause = false) => {
    currentSong.src = `/${currFolder}/` + encodeURIComponent(track);
    if (!pause) {
        currentSong.play();
        document.getElementById("play").src = "img/pause.svg";
    }
    document.querySelector(".songinfo").innerHTML = decodeURI(track);
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
};

async function displayAlbums() {
    console.log("Displaying albums");
    try {
        let a = await fetch(`/songs/`);
        let response = await a.text();
        let div = document.createElement("div");
        div.innerHTML = response;
        let anchors = div.getElementsByTagName("a");
        let cardContainer = document.querySelector(".cardContainer");

        Array.from(anchors).forEach(async (e) => {
            if (e.href.includes("/songs/")) {
                let folder = decodeURIComponent(e.href.split("/songs/")[1].replace("/", ""));
                try {
                    let res = await fetch(`/songs/${folder}/info.json`);
                    if (!res.ok) throw new Error("Missing info.json");
                    let info = await res.json();

                    cardContainer.innerHTML += `
                    <div data-folder="${folder}" class="card">
                        <div class="play">
                            <svg width="16" height="16" viewBox="0 0 24 24"><path d="M5 20V4L19 12L5 20Z" fill="#000"/></svg>
                        </div>
                        <img src="/songs/${folder}/cover.jpg" alt="">
                        <h2>${info.title}</h2>
                        <p>${info.description}</p>
                    </div>`;
                } catch (err) {
                    console.warn(`Skipping ${folder}: ${err.message}`);
                }
            }
        });

        // Wait a bit to attach event listeners
        setTimeout(() => {
            Array.from(document.querySelectorAll(".card")).forEach(card => {
                card.addEventListener("click", async () => {
                    songs = await getSongs(`songs/${card.dataset.folder}`);
                    playMusic(songs[0]);
                });
            });
        }, 1000);

    } catch (err) {
        console.error("Failed to load albums:", err);
    }
}

async function main() {
    await getSongs("songs/ncs");
    playMusic(songs[0], true);
    await displayAlbums();

    const play = document.getElementById("play");
    const previous = document.getElementById("previous");
    const next = document.getElementById("next");

    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "img/pause.svg";
        } else {
            currentSong.pause();
            play.src = "img/play.svg";
        }
    });

    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
    });

    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        currentSong.currentTime = (percent / 100) * currentSong.duration;
        document.querySelector(".circle").style.left = percent + "%";
    });

    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    previous.addEventListener("click", () => {
        let index = songs.indexOf(currentSong.src.split("/").pop());
        if (index > 0) playMusic(songs[index - 1]);
    });

    next.addEventListener("click", () => {
        let index = songs.indexOf(currentSong.src.split("/").pop());
        if (index < songs.length - 1) playMusic(songs[index + 1]);
    });

    document.querySelector(".range input").addEventListener("input", (e) => {
        currentSong.volume = e.target.value / 100;
        document.querySelector(".volume img").src = currentSong.volume === 0 ? "img/mute.svg" : "img/volume.svg";
    });

    document.querySelector(".volume img").addEventListener("click", (e) => {
        if (e.target.src.includes("volume.svg")) {
            currentSong.volume = 0;
            e.target.src = e.target.src.replace("volume.svg", "mute.svg");
            document.querySelector(".range input").value = 0;
        } else {
            currentSong.volume = 0.1;
            e.target.src = e.target.src.replace("mute.svg", "volume.svg");
            document.querySelector(".range input").value = 10;
        }
    });
}

main();
