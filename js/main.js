// WaveSurfer.jsを利用して10バンドのイコライザ機能を備えたWebオーディオプレーヤーの実装テスト
// 20241114 Masako Nakashizuka

document.addEventListener('DOMContentLoaded', () => {

  // 言語に応じたテキストをUIに反映する関数	
  const translations = {
    en: {
      playPause: "Play / Pause",
      selectPreset: "Select a preset",
      defaultPreset: "Default settings",
      loadPreset: "Load Preset",
      clearPreset: "Clear Preset",
      addPreset: "Add New preset name",
      savePreset: "Save",
      myPresetNote: "My Preset Note",
      nameHeader: "Name",
      frequencyHeader: "Frequency setting",
      languageButton: "English",
      fileLabel: "Choose files"
    },
    ja: {
      playPause: "再生 / 停止",
      selectPreset: "プリセットを選択",
      defaultPreset: "デフォルト設定",
      loadPreset: "プリセットを読み込む",
      clearPreset: "プリセットをクリア",
      addPreset: "新しいプリセット名を追加",
      savePreset: "保存",
      myPresetNote: "マイプリセットノート",
      nameHeader: "名前",
      frequencyHeader: "周波数設定",
      languageButton: "日本語",
      fileLabel: "ファイルを選択"
    }
  };

  let currentLanguage = 'en'; // デフォルトの言語設定 
  // 言語に応じたテキストをUIに反映する関数
  function updateLanguage() {
    document.getElementById("playButton").textContent = translations[currentLanguage].playPause;
    document.getElementById("presetSelect").options[0].textContent = translations[currentLanguage].selectPreset;
    document.getElementById("presetSelect").options[1].textContent = translations[currentLanguage].defaultPreset;
    document.getElementById("loadButton").textContent = translations[currentLanguage].loadPreset;
    document.getElementById("clearButton").textContent = translations[currentLanguage].clearPreset;
    document.getElementById("presetName").placeholder = translations[currentLanguage].addPreset;
    document.getElementById("saveButton").textContent = translations[currentLanguage].savePreset;
    document.querySelector(".wrapper h3").textContent = translations[currentLanguage].myPresetNote;
    document.querySelector("#presetTable thead th:first-child").textContent = translations[currentLanguage].nameHeader;
    document.querySelector("#presetTable thead th:last-child").textContent = translations[currentLanguage].frequencyHeader;
    document.getElementById("languageToggle").textContent = translations[currentLanguage].languageButton;
    document.getElementById("fileLabel").textContent = translations[currentLanguage].fileLabel;
  }
  // 初期ロード時の言語更新
  updateLanguage();
  // 言語切り替えボタンのイベントリスナー
  document.getElementById("languageToggle").addEventListener("click", () => {
    currentLanguage = currentLanguage === 'ja' ? 'en' : 'ja';
    updateLanguage();
  });

  // 初期設定の音声ファイル
  const initialAudioSrc = 'mp3/01_SAMPLE.mp3';

  // オーディオ要素を作成し、初期音源を設定
  const audio = new Audio();
  audio.src = initialAudioSrc;
  audio.controls = true;

  const audioContext = new(window.AudioContext || window.webkitAudioContext)();
  const gainNode = audioContext.createGain(); // ゲインノードの作成
  // 各周波数のEQバンドを設定
  const eqBands = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
  const filters = eqBands.map((band) => {
    const filter = audioContext.createBiquadFilter();
    filter.type = band <= 32 ? 'lowshelf' : band >= 16000 ? 'highshelf' : 'peaking';
    filter.frequency.value = band;
    filter.gain.value = 0; // 初期ゲイン値
    return filter;
  });
  // フィルタとゲインノードの接続
  const mediaElementSource = audioContext.createMediaElementSource(audio);
  mediaElementSource.connect(filters[0]);
  filters.reduce((prev, curr) => {
    prev.connect(curr);
    return curr;
  }).connect(gainNode);
  gainNode.connect(audioContext.destination);

  // WaveSurferを初期化して波形を表示
  const wavesurfer = WaveSurfer.create({
    container: '#waveform',
    waveColor: '#FF4500',
    progressColor: '#666666',
    backend: 'MediaElement',
    media: audio,
    scrollParent: true,
    minPxPerSec: 100
  });

  // 初期設定のファイルを読み込んで波形を表示
  wavesurfer.load(initialAudioSrc);
  document.getElementById("audioFileName").textContent = "01_SAMPLE.mp3";
  // ズーム機能の設定
  let zoomLevel = 100;
  document.getElementById('zoomInButton').addEventListener('click', () => {
    zoomLevel = Math.min(zoomLevel + 10, 500);
    wavesurfer.zoom(zoomLevel);
  });

  document.getElementById('zoomOutButton').addEventListener('click', () => {
    zoomLevel = Math.max(zoomLevel - 10, 20);
    wavesurfer.zoom(zoomLevel);
  });
  // 再生/停止ボタンの設定
  document.getElementById('playButton').addEventListener('click', () => {
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    audio.paused ? audio.play() : audio.pause();
  });
  // ファイル選択後、プレイリストを更新して再生設定
  document.getElementById("audioFileInput").addEventListener("change", function (event) {
    const files = event.target.files;
    const playlist = document.getElementById("playlist");
    playlist.innerHTML = ""; // プレイリストをクリア

    Array.from(files).forEach((file) => {
      const fileURL = URL.createObjectURL(file);
      const listItem = document.createElement("li");
      listItem.textContent = file.name;
      listItem.classList.add("playlist-item");
      listItem.setAttribute("data-url", fileURL);

      listItem.addEventListener("click", () => {
        audio.src = fileURL;
        document.getElementById("audioFileName").textContent = file.name;
        wavesurfer.load(fileURL); // 追加: wavesurferのソースも更新
        audio.play();
      });

      playlist.appendChild(listItem);
    });
  });
  // EQスライダーを生成して表示
  const container = document.getElementById('eqBands-area');
  filters.forEach((filter, index) => {
    const sliderContainer = document.createElement('div');
    sliderContainer.className = 'slider-container';

    const label = document.createElement('span');
    label.className = 'slider-label';
    label.textContent = eqBands[index] >= 1000 ? `${eqBands[index] / 1000} kHz` : `${eqBands[index]} Hz`;

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.className = 'slider';
    slider.min = -40;
    slider.max = 40;
    slider.value = filter.gain.value;
    slider.step = 0.1;

    const valueLabel = document.createElement('div');
    valueLabel.className = 'slider-value';
    valueLabel.textContent = filter.gain.value.toFixed(1);

    slider.oninput = (e) => {
      const value = parseFloat(e.target.value);
      filter.gain.value = value;
      valueLabel.textContent = value.toFixed(1);
    };

    sliderContainer.appendChild(slider);
    sliderContainer.appendChild(label);
    sliderContainer.appendChild(valueLabel);
    container.appendChild(sliderContainer);
  });
  // ゲインスライダーの設定
  const gainSlider = document.getElementById('gainSlider');
  gainSlider.addEventListener('input', function () {
    gainNode.gain.value = parseFloat(gainSlider.value);
    document.getElementById('gainMeter').textContent = gainNode.gain.value.toFixed(2);
  });

  // プリセット保存機能
  document.getElementById('saveButton').addEventListener('click', () => {
    const presetName = document.getElementById('presetName').value;
    if (presetName) {
      const preset = eqBands.reduce((acc, band, index) => {
        acc[band] = filters[index].gain.value;
        return acc;
      }, {});
      localStorage.setItem(`preset_${presetName}`, JSON.stringify(preset));
      alert(`プリセット「${presetName}」を保存しました。`);
      displayPresets();
      updatePresetSelect();
    } else {
      alert("プリセット名を入力してください。");
    }
  });
  // プリセットの読み込み機能
  document.getElementById('loadButton').addEventListener('click', () => {
    const presetSelect = document.getElementById('presetSelect');
    const selectedPreset = presetSelect.value;

    if (selectedPreset === "default") {
      eqBands.forEach((band, index) => {
        filters[index].gain.value = 0;
        const slider = container.querySelectorAll('.slider')[index];
        slider.value = filters[index].gain.value;
        const valueLabel = container.querySelectorAll('.slider-value')[index];
        valueLabel.textContent = filters[index].gain.value.toFixed(1);
      });
      alert("デフォルト設定を適用しました。");
    } else {
      const presetData = JSON.parse(localStorage.getItem(`preset_${selectedPreset}`));
      if (presetData) {
        eqBands.forEach((band, index) => {
          const gainValue = presetData[band];
          filters[index].gain.value = gainValue;
          const slider = container.querySelectorAll('.slider')[index];
          slider.value = gainValue;
          const valueLabel = container.querySelectorAll('.slider-value')[index];
          valueLabel.textContent = gainValue.toFixed(1);
        });
        alert(`プリセット「${selectedPreset}」を読み込みました。`);
      } else {
        alert("選択したプリセットが見つかりません。");
      }
    }
  });
  // ローカルストレージに保存されたプリセットの表示
  function displayPresets() {
    const tbody = document.getElementById('presetTable').querySelector('tbody');
    tbody.innerHTML = '';

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('preset_')) {
        const presetName = key.replace('preset_', '');
        const presetData = JSON.parse(localStorage.getItem(key));

        const formattedPresetData = Object.entries(presetData)
          .map(([band, value]) => {
            const displayBand = band >= 1000 ? `${band / 1000} kHz` : `${band} Hz`;
            return `${displayBand}: ${parseFloat(value).toFixed(1)}`;
          })
          .join('<br>');

        const row = document.createElement('tr');

        const nameCell = document.createElement('td');
        nameCell.textContent = presetName;

        const dataCell = document.createElement('td');
        dataCell.innerHTML = formattedPresetData;

        row.appendChild(nameCell);
        row.appendChild(dataCell);
        tbody.appendChild(row);
      }
    }
  }
  // プリセットセレクトボックスの更新
  function updatePresetSelect() {
    const presetSelect = document.getElementById('presetSelect');
    presetSelect.innerHTML = '<option value="">Select preset</option>';
    presetSelect.innerHTML += '<option value="default">Default settings</option>';

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('preset_')) {
        const presetName = key.replace('preset_', '');
        const option = document.createElement('option');
        option.value = presetName;
        option.textContent = presetName;
        presetSelect.appendChild(option);
      }
    }
  }
  // プリセット削除
  document.getElementById('clearButton').addEventListener('click', () => {
    const presetSelect = document.getElementById('presetSelect');
    const selectedPreset = presetSelect.value;

    if (selectedPreset) {
      localStorage.removeItem(`preset_${selectedPreset}`);
      alert(`プリセット「${selectedPreset}」を削除しました。`);
      displayPresets();
      updatePresetSelect();
    } else {
      alert("削除するプリセットを選択してください。");
    }
  });

  displayPresets(); // 初期ロード時のプリセット表示
  updatePresetSelect(); // プリセットセレクトの更新
});
