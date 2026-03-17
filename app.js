// ====== データ ======
    const STORAGE_KEY = "dance-layout-v2";
    let members = [];
    let equipments = [];
    let stageItems = [];
    let songs = {};
    let currentSong = "";
    let timeframes = [];

    // ====== DOM ======
    const memberList = document.getElementById("memberList");
    const openMemberManagerBtn = document.getElementById("openMemberManagerBtn");
    const equipmentList = document.getElementById("equipmentList");
    const openEquipmentManagerBtn = document.getElementById("openEquipmentManagerBtn");
    const memberManagerModal = document.getElementById("memberManagerModal");
    const memberManagerList = document.getElementById("memberManagerList");
    const addMemberRowBtn = document.getElementById("addMemberRowBtn");
    const saveMemberManagerBtn = document.getElementById("saveMemberManagerBtn");
    const cancelMemberManagerBtn = document.getElementById("cancelMemberManagerBtn");
    const closeMemberManagerBtn = document.getElementById("closeMemberManagerBtn");
    const equipmentManagerModal = document.getElementById("equipmentManagerModal");
    const equipmentManagerList = document.getElementById("equipmentManagerList");
    const addCameraRowBtn = document.getElementById("addCameraRowBtn");
    const addLightingRowBtn = document.getElementById("addLightingRowBtn");
    const saveEquipmentManagerBtn = document.getElementById("saveEquipmentManagerBtn");
    const cancelEquipmentManagerBtn = document.getElementById("cancelEquipmentManagerBtn");
    const closeEquipmentManagerBtn = document.getElementById("closeEquipmentManagerBtn");
    const stage = document.getElementById("stage");
    const toggleNames = document.getElementById("toggleNames");
    const songNameInput = document.getElementById("songName");
    const saveSongBtn = document.getElementById("saveSong");
    const downloadBtn = document.getElementById("downloadBtn");
    const uploadFile = document.getElementById("uploadFile");
    const uploadBtn = document.getElementById("uploadBtn");
    const songSelect = document.getElementById("songSelect");
    const loadSongBtn = document.getElementById("loadSong");
    const deleteSongBtn = document.getElementById("deleteSong");
    const timeframesList = document.getElementById("timeframesList");
    const frameStartMin = document.getElementById("frameStartMin");
    const frameStartSec = document.getElementById("frameStartSec");
    const frameEndMin = document.getElementById("frameEndMin");
    const frameEndSec = document.getElementById("frameEndSec");
    const setStartFromCurrentBtn = document.getElementById("setStartFromCurrentBtn");
    const setEndFromCurrentBtn = document.getElementById("setEndFromCurrentBtn");
    const frameLyrics = document.getElementById("frameLyrics");
    const addFrameBtn = document.getElementById("addFrameBtn");
    const youtubeUrl = document.getElementById("youtubeUrl");
    const loadVideoBtn = document.getElementById("loadVideoBtn");
    const toggleVideoDisplay = document.getElementById("toggleVideoDisplay");
    const videoContainer = document.getElementById("videoContainer");
    const youtubePlayer = document.getElementById("youtubePlayer");
    const playBtn = document.getElementById("playBtn");
    const pauseBtn = document.getElementById("pauseBtn");
    const currentTimeDisplay = document.getElementById("currentTime");
    const durationDisplay = document.getElementById("duration");
    const progressBar = document.getElementById("progressBar");
    const captureStageBtn = document.getElementById("captureStageBtn");

    let player = null;
    let isPlayerReady = false;
    let progressInterval = null;
    let videoDisplayMode = true; // true = video shown, false = controls only
    let isPlaying = false;
    let lastAppliedFrameIndex = -1;
    let currentVideoId = "";
    let activeMemberEditor = null;
    let activeTimeframeEditor = null;
    let memberManagerDraft = [];
    let equipmentManagerDraft = [];

    const EQUIPMENT_TYPE_META = {
      camera: { label: "カメラ", color: "#111111" },
      lighting: { label: "照明", color: "#f7f4e8" },
    };

    const DEFAULT_CONE = { angle: -90, spread: 120, length: 96 };

    function getEquipmentMeta(type) {
      return EQUIPMENT_TYPE_META[type] || EQUIPMENT_TYPE_META.camera;
    }

    function getEquipmentColor(equipment) {
      return equipment.color || getEquipmentMeta(equipment.type).color;
    }

    // ====== ヘルパー ======
    function generateId() {
      return "id-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
    }

    function closeTimeframeEditor() {
      if (!activeTimeframeEditor) return;
      activeTimeframeEditor.remove();
      activeTimeframeEditor = null;
    }

    function formatFrameRange(frame) {
      return `${String(Math.floor(frame.startTime / 60)).padStart(2, "0")}:${String(frame.startTime % 60).padStart(2, "0")} ～ ${String(Math.floor(frame.endTime / 60)).padStart(2, "0")}:${String(frame.endTime % 60).padStart(2, "0")}`;
    }

    function openTimeframeEditor(frame, anchorEl) {
      closeTimeframeEditor();

      const pop = document.createElement("div");
      pop.className = "timeframe-edit-popover";

      const timeRow = document.createElement("div");
      timeRow.className = "timeframe-edit-time-row";

      const startMinInput = document.createElement("input");
      startMinInput.type = "number";
      startMinInput.min = "0";
      startMinInput.className = "timeframe-edit-number";
      startMinInput.value = String(Math.floor(frame.startTime / 60));

      const startSecInput = document.createElement("input");
      startSecInput.type = "number";
      startSecInput.min = "0";
      startSecInput.max = "59";
      startSecInput.className = "timeframe-edit-number";
      startSecInput.value = String(frame.startTime % 60);

      const endMinInput = document.createElement("input");
      endMinInput.type = "number";
      endMinInput.min = "0";
      endMinInput.className = "timeframe-edit-number";
      endMinInput.value = String(Math.floor(frame.endTime / 60));

      const endSecInput = document.createElement("input");
      endSecInput.type = "number";
      endSecInput.min = "0";
      endSecInput.max = "59";
      endSecInput.className = "timeframe-edit-number";
      endSecInput.value = String(frame.endTime % 60);

      const separator1 = document.createElement("span");
      separator1.textContent = ":";
      const wave = document.createElement("span");
      wave.textContent = "～";
      const separator2 = document.createElement("span");
      separator2.textContent = ":";

      timeRow.appendChild(startMinInput);
      timeRow.appendChild(separator1);
      timeRow.appendChild(startSecInput);
      timeRow.appendChild(wave);
      timeRow.appendChild(endMinInput);
      timeRow.appendChild(separator2);
      timeRow.appendChild(endSecInput);

      const lyricsInput = document.createElement("input");
      lyricsInput.type = "text";
      lyricsInput.className = "timeframe-edit-lyrics";
      lyricsInput.placeholder = "メモ(歌詞など)";
      lyricsInput.value = frame.lyrics || "";

      const actions = document.createElement("div");
      actions.className = "timeframe-edit-actions";

      const updateLayoutBtn = document.createElement("button");
      updateLayoutBtn.type = "button";
      updateLayoutBtn.className = "timeframe-edit-secondary";
      updateLayoutBtn.textContent = "現在の配置を保存";

      const saveBtn = document.createElement("button");
      saveBtn.type = "button";
      saveBtn.className = "timeframe-edit-save";
      saveBtn.textContent = "保存";

      const cancelBtn = document.createElement("button");
      cancelBtn.type = "button";
      cancelBtn.className = "timeframe-edit-cancel";
      cancelBtn.textContent = "閉じる";

      actions.appendChild(updateLayoutBtn);
      actions.appendChild(saveBtn);
      actions.appendChild(cancelBtn);

      pop.appendChild(timeRow);
      pop.appendChild(lyricsInput);
      pop.appendChild(actions);

      document.body.appendChild(pop);
      activeTimeframeEditor = pop;

      const rect = anchorEl.getBoundingClientRect();
      const popRect = pop.getBoundingClientRect();
      let left = rect.left + rect.width / 2 - popRect.width / 2;
      left = Math.max(8, Math.min(left, window.innerWidth - popRect.width - 8));
      let top = rect.top - popRect.height - 8;
      if (top < 8) top = rect.bottom + 8;
      pop.style.left = `${left}px`;
      pop.style.top = `${top}px`;

      const saveEdit = () => {
        const startTime = (parseInt(startMinInput.value, 10) || 0) * 60 + (parseInt(startSecInput.value, 10) || 0);
        const endTime = (parseInt(endMinInput.value, 10) || 0) * 60 + (parseInt(endSecInput.value, 10) || 0);

        if (startTime >= endTime) {
          alert("開始時刻は終了時刻より前にしてください。");
          return;
        }

        frame.startTime = startTime;
        frame.endTime = endTime;
        frame.lyrics = lyricsInput.value.trim();
        timeframes.sort((a, b) => a.startTime - b.startTime);
        renderTimeframes();
        saveStorage();
        closeTimeframeEditor();
      };

      updateLayoutBtn.addEventListener("click", () => {
        frame.stageItems = stageItems.map((item) => ({ ...item }));
        saveStorage();
      });
      saveBtn.addEventListener("click", saveEdit);
      cancelBtn.addEventListener("click", closeTimeframeEditor);

      [startMinInput, startSecInput, endMinInput, endSecInput, lyricsInput].forEach((input) => {
        input.addEventListener("keydown", (ev) => {
          if (ev.key === "Enter") saveEdit();
          if (ev.key === "Escape") closeTimeframeEditor();
        });
      });

      pop.addEventListener("click", (ev) => ev.stopPropagation());

      setTimeout(() => {
        const onDocClick = (ev) => {
          if (activeTimeframeEditor && !activeTimeframeEditor.contains(ev.target)) {
            closeTimeframeEditor();
            document.removeEventListener("click", onDocClick);
          }
        };
        document.addEventListener("click", onDocClick);
      }, 0);

      startMinInput.focus();
      startMinInput.select();
    }

    function saveStorage(options = {}) {
      const { mergeExistingSongs = true } = options;
      const youtubeState = getCurrentYoutubeState();

      let songsToSave = songs;
      if (mergeExistingSongs) {
        try {
          const existingTxt = localStorage.getItem(STORAGE_KEY);
          if (existingTxt) {
            const existingData = JSON.parse(existingTxt);
            const existingSongs =
              existingData && typeof existingData.songs === "object" && !Array.isArray(existingData.songs)
                ? existingData.songs
                : {};
            songsToSave = { ...existingSongs, ...songs };
          }
        } catch (e) {
          console.warn("既存保存データのマージに失敗", e);
        }
      }

      songs = songsToSave;
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          members,
          equipments,
          stageItems,
          songs: songsToSave,
          currentSong,
          timeframes,
          youtubeUrl: youtubeState.youtubeUrl,
          youtubeVideoId: youtubeState.youtubeVideoId,
        })
      );
    }

    function loadStorage() {
      const txt = localStorage.getItem(STORAGE_KEY);
      if (!txt) return;
      timeframes.sort((a, b) => a.startTime - b.startTime);
      try {
        const data = JSON.parse(txt);
        members = Array.isArray(data.members) ? data.members : [];
        equipments = Array.isArray(data.equipments) ? data.equipments : [];
        stageItems = Array.isArray(data.stageItems) ? data.stageItems : [];
        songs = data.songs || {};
        currentSong = data.currentSong || "";
        timeframes = Array.isArray(data.timeframes) ? data.timeframes : [];
        applyYouTubeState(data);
      } catch (e) {
        console.warn("読み込み失敗", e);
      }
    }

    function updateSongSelect() {
      songSelect.innerHTML = "";
      const names = Object.keys(songs).sort();
      if (names.length === 0) {
        songSelect.innerHTML = '<option value="">保存なし</option>';
        return;
      }
      names.forEach((name) => {
        const o = document.createElement("option");
        o.value = name;
        o.textContent = name;
        if (name === currentSong) o.selected = true;
        songSelect.appendChild(o);
      });
    }

    function closeMemberEditor() {
      if (!activeMemberEditor) return;
      activeMemberEditor.remove();
      activeMemberEditor = null;
    }

    function syncItemsWithMembers(items, membersById) {
      return items.reduce((result, item) => {
        if (item.itemType === "equipment") {
          result.push({ ...item });
          return result;
        }
        const member = membersById.get(item.memberId);
        if (!member) return result;
        result.push({
          ...item,
          name: member.name,
          color: member.color,
        });
        return result;
      }, []);
    }

    function applyMembersState(nextMembers) {
      members = nextMembers.map((member) => ({ ...member }));
      const membersById = new Map(members.map((member) => [member.id, member]));
      stageItems = syncItemsWithMembers(stageItems, membersById);
      timeframes = timeframes.map((frame) => ({
        ...frame,
        stageItems: syncItemsWithMembers(frame.stageItems || [], membersById),
      }));
    }

    function syncItemsWithEquipments(items, equipmentsById) {
      return items.reduce((result, item) => {
        if (item.itemType === "equipment") {
          const equipment = equipmentsById.get(item.equipmentId);
          if (!equipment) return result;
          result.push({
            ...item,
            itemType: "equipment",
            equipmentId: equipment.id,
            equipmentType: equipment.type,
            name: equipment.name,
            color: getEquipmentColor(equipment),
            coneVisible: equipment.coneVisible !== false,
            coneAngle: typeof item.coneAngle === "number" ? item.coneAngle : DEFAULT_CONE.angle,
            coneSpread: typeof item.coneSpread === "number" ? item.coneSpread : DEFAULT_CONE.spread,
            coneLength: typeof item.coneLength === "number" ? item.coneLength : DEFAULT_CONE.length,
          });
          return result;
        }
        result.push({ ...item });
        return result;
      }, []);
    }

    function applyEquipmentsState(nextEquipments) {
      equipments = nextEquipments.map((equipment) => ({ ...equipment }));
      const equipmentsById = new Map(equipments.map((equipment) => [equipment.id, equipment]));
      stageItems = syncItemsWithEquipments(stageItems, equipmentsById);
      timeframes = timeframes.map((frame) => ({
        ...frame,
        stageItems: syncItemsWithEquipments(frame.stageItems || [], equipmentsById),
      }));
    }

    function closeMemberManager() {
      memberManagerModal.classList.add("hidden");
      memberManagerModal.setAttribute("aria-hidden", "true");
      memberManagerDraft = [];
    }

    function closeEquipmentManager() {
      equipmentManagerModal.classList.add("hidden");
      equipmentManagerModal.setAttribute("aria-hidden", "true");
      equipmentManagerDraft = [];
    }

    function renderMemberManagerRows() {
      memberManagerList.innerHTML = "";

      if (memberManagerDraft.length === 0) {
        const empty = document.createElement("div");
        empty.className = "empty-msg";
        empty.textContent = "メンバーがいません。追加してください。";
        memberManagerList.appendChild(empty);
        return;
      }

      memberManagerDraft.forEach((member, index) => {
        const row = document.createElement("div");
        row.className = "member-manager-row";

        const colorInput = document.createElement("input");
        colorInput.type = "color";
        colorInput.className = "member-manager-color";
        colorInput.value = member.color || "#ff0000";
        colorInput.addEventListener("input", () => {
          memberManagerDraft[index].color = colorInput.value;
        });

        const nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.className = "member-manager-name";
        nameInput.placeholder = "名前";
        nameInput.value = member.name || "";
        nameInput.addEventListener("input", () => {
          memberManagerDraft[index].name = nameInput.value;
        });

        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "member-manager-delete-btn";
        deleteBtn.textContent = "削除";
        deleteBtn.addEventListener("click", () => {
          memberManagerDraft = memberManagerDraft.filter((_, draftIndex) => draftIndex !== index);
          renderMemberManagerRows();
        });

        row.appendChild(colorInput);
        row.appendChild(nameInput);
        row.appendChild(deleteBtn);
        memberManagerList.appendChild(row);
      });
    }

    function openMemberManager() {
      closeMemberEditor();
      memberManagerDraft = members.map((member) => ({ ...member }));
      renderMemberManagerRows();
      memberManagerModal.classList.remove("hidden");
      memberManagerModal.setAttribute("aria-hidden", "false");

      const firstInput = memberManagerList.querySelector(".member-manager-name");
      if (firstInput) {
        firstInput.focus();
        firstInput.select();
      }
    }

    function renderEquipmentManagerRows() {
      equipmentManagerList.innerHTML = "";

      if (equipmentManagerDraft.length === 0) {
        const empty = document.createElement("div");
        empty.className = "empty-msg";
        empty.textContent = "カメラ・照明がありません。追加してください。";
        equipmentManagerList.appendChild(empty);
        return;
      }

      equipmentManagerDraft.forEach((equipment, index) => {
        const row = document.createElement("div");
        row.className = "member-manager-row equipment-manager-row";

        const meta = EQUIPMENT_TYPE_META[equipment.type] || EQUIPMENT_TYPE_META.camera;

        const colorInput = document.createElement("input");
        colorInput.type = "color";
        colorInput.className = "member-manager-color";
        colorInput.value = equipment.color || meta.color;
        colorInput.addEventListener("input", () => {
          equipmentManagerDraft[index].color = colorInput.value;
        });

        const nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.className = "member-manager-name";
        nameInput.placeholder = "名前";
        nameInput.value = equipment.name || "";
        nameInput.addEventListener("input", () => {
          equipmentManagerDraft[index].name = nameInput.value;
        });

        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "member-manager-delete-btn";
        deleteBtn.textContent = "削除";
        deleteBtn.addEventListener("click", () => {
          equipmentManagerDraft = equipmentManagerDraft.filter((_, draftIndex) => draftIndex !== index);
          renderEquipmentManagerRows();
        });

        row.appendChild(colorInput);
        row.appendChild(nameInput);
        row.appendChild(deleteBtn);
        equipmentManagerList.appendChild(row);
      });
    }

    function openEquipmentManager() {
      closeMemberEditor();
      equipmentManagerDraft = equipments.map((equipment) => ({ ...equipment }));
      renderEquipmentManagerRows();
      equipmentManagerModal.classList.remove("hidden");
      equipmentManagerModal.setAttribute("aria-hidden", "false");

      const firstInput = equipmentManagerList.querySelector(".member-manager-name");
      if (firstInput) {
        firstInput.focus();
        firstInput.select();
      }
    }

    function openMemberEditor(member, anchorEl) {
      closeMemberEditor();

      const pop = document.createElement("div");
      pop.className = "member-edit-popover";

      const nameInput = document.createElement("input");
      nameInput.type = "text";
      nameInput.className = "member-edit-name";
      nameInput.value = member.name;

      const colorInput = document.createElement("input");
      colorInput.type = "color";
      colorInput.className = "member-edit-color";
      colorInput.value = member.color || "#ff0000";

      const saveBtn = document.createElement("button");
      saveBtn.type = "button";
      saveBtn.className = "member-edit-save";
      saveBtn.textContent = "保存";

      const cancelBtn = document.createElement("button");
      cancelBtn.type = "button";
      cancelBtn.className = "member-edit-cancel";
      cancelBtn.textContent = "閉じる";

      const actions = document.createElement("div");
      actions.className = "member-edit-actions";
      actions.appendChild(saveBtn);
      actions.appendChild(cancelBtn);

      pop.appendChild(nameInput);
      pop.appendChild(colorInput);
      pop.appendChild(actions);

      document.body.appendChild(pop);
      activeMemberEditor = pop;

      const rect = anchorEl.getBoundingClientRect();
      const popRect = pop.getBoundingClientRect();
      let left = rect.left + rect.width / 2 - popRect.width / 2;
      left = Math.max(8, Math.min(left, window.innerWidth - popRect.width - 8));
      let top = rect.top - popRect.height - 8;
      if (top < 8) top = rect.bottom + 8;

      pop.style.left = `${left}px`;
      pop.style.top = `${top}px`;

      const saveEdit = () => {
        const newName = nameInput.value.trim();
        if (!newName) {
          alert("名前は空にできません。");
          return;
        }

        member.name = newName;
        member.color = colorInput.value;

        stageItems.forEach((item) => {
          if (item.memberId === member.id) {
            item.name = newName;
            item.color = member.color;
          }
        });

        renderMembers();
        renderStage();
        saveStorage();
        closeMemberEditor();
      };

      saveBtn.addEventListener("click", saveEdit);
      cancelBtn.addEventListener("click", closeMemberEditor);

      nameInput.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter") saveEdit();
        if (ev.key === "Escape") closeMemberEditor();
      });

      pop.addEventListener("click", (ev) => ev.stopPropagation());

      setTimeout(() => {
        const onDocClick = (ev) => {
          if (activeMemberEditor && !activeMemberEditor.contains(ev.target)) {
            closeMemberEditor();
            document.removeEventListener("click", onDocClick);
          }
        };
        document.addEventListener("click", onDocClick);
      }, 0);

      nameInput.focus();
      nameInput.select();
    }

    function renderMembers() {
      memberList.innerHTML = "";
      if (members.length === 0) {
        memberList.innerHTML = '<div class="empty-msg">メンバーがいません。追加・編集から登録してください。</div>';
        return;
      }

      members.forEach((m) => {
        const row = document.createElement("div");
        row.className = "member-row";
        row.draggable = true;
        row.title = `${m.name} (${m.color})`;

        const startMemberDrag = (ev) => {
          ev.dataTransfer.setData(
            "application/json",
            JSON.stringify({ type: "member", memberId: m.id })
          );

          const dragPreview = document.createElement("div");
          dragPreview.style.position = "fixed";
          dragPreview.style.left = "-9999px";
          dragPreview.style.top = "-9999px";
          dragPreview.style.display = "flex";
          dragPreview.style.flexDirection = "column";
          dragPreview.style.alignItems = "center";
          dragPreview.style.gap = "4px";
          dragPreview.style.padding = "4px";
          
          const dragDot = document.createElement("div");
          dragDot.className = "member-dot";
          dragDot.style.backgroundColor = m.color;
          dragDot.style.margin = "0";
          dragPreview.appendChild(dragDot);
          
          const dragLabel = document.createElement("div");
          dragLabel.textContent = m.name;
          dragLabel.style.fontSize = "12px";
          dragLabel.style.color = "#333";
          dragLabel.style.fontWeight = "bold";
          dragLabel.style.whiteSpace = "nowrap";
          dragPreview.appendChild(dragLabel);
          
          document.body.appendChild(dragPreview);
          ev.dataTransfer.setDragImage(dragPreview, 16, 16);

          setTimeout(() => {
            dragPreview.remove();
          }, 0);
        };
        row.addEventListener("dragstart", startMemberDrag);

        const dot = document.createElement("div");
        dot.className = "member-dot";
        dot.style.backgroundColor = m.color;
        dot.dataset.memberId = m.id;

        const label = document.createElement("span");
        label.className = "member-name-label";
        label.textContent = m.name;
        label.title = "追加・編集ボタンから一括編集できます";
        
        const deleteBtn = document.createElement("button");
        deleteBtn.className = "member-delete-btn";
        deleteBtn.textContent = "✕";
        deleteBtn.type = "button";
        deleteBtn.draggable = false;
        deleteBtn.title = "メンバーを削除";
        deleteBtn.addEventListener("click", () => {
          members = members.filter((x) => x.id !== m.id);
          stageItems = stageItems.filter((x) => x.memberId !== m.id);
          renderMembers();
          renderStage();
          saveStorage();
        });
        
        row.appendChild(dot);
        row.appendChild(label);
        row.appendChild(deleteBtn);
        memberList.appendChild(row);
      });
    }

    function renderEquipments() {
      equipmentList.innerHTML = "";
      if (equipments.length === 0) {
        equipmentList.innerHTML = '<div class="empty-msg">カメラ・照明がありません。追加・編集から登録してください。</div>';
        return;
      }

      equipments.forEach((equipment) => {
        const meta = getEquipmentMeta(equipment.type);
        const equipmentColor = equipment.color || meta.color;

        const row = document.createElement("div");
        row.className = `member-row equipment-row ${equipment.type === "lighting" ? "equipment-row-lighting" : "equipment-row-camera"}`;
        row.draggable = true;
        row.title = `${equipment.name} (${meta.label})`;

        row.addEventListener("dragstart", (ev) => {
          ev.dataTransfer.setData(
            "application/json",
            JSON.stringify({ type: "equipment", equipmentId: equipment.id })
          );

          const dragPreview = document.createElement("div");
          dragPreview.style.position = "fixed";
          dragPreview.style.left = "-9999px";
          dragPreview.style.top = "-9999px";
          dragPreview.style.display = "flex";
          dragPreview.style.flexDirection = "column";
          dragPreview.style.alignItems = "center";
          dragPreview.style.gap = "4px";
          dragPreview.style.padding = "4px";

          const dragDot = document.createElement("div");
          dragDot.className = "member-dot";
          dragDot.style.backgroundColor = equipmentColor;
          dragDot.style.margin = "0";
          dragPreview.appendChild(dragDot);

          const dragLabel = document.createElement("div");
          dragLabel.textContent = equipment.name;
          dragLabel.style.fontSize = "12px";
          dragLabel.style.color = "#333";
          dragLabel.style.fontWeight = "bold";
          dragLabel.style.whiteSpace = "nowrap";
          dragPreview.appendChild(dragLabel);

          document.body.appendChild(dragPreview);
          ev.dataTransfer.setDragImage(dragPreview, 16, 16);

          setTimeout(() => {
            dragPreview.remove();
          }, 0);
        });

        const dot = document.createElement("div");
        dot.className = "member-dot";
        dot.style.backgroundColor = equipmentColor;

        const label = document.createElement("span");
        label.className = "member-name-label";
        label.textContent = equipment.name;

        const toggleLineBtn = document.createElement("button");
        toggleLineBtn.className = "equipment-line-toggle-btn";
        toggleLineBtn.type = "button";
        toggleLineBtn.draggable = false;
        const isConeVisible = equipment.coneVisible !== false;
        toggleLineBtn.textContent = isConeVisible ? "線ON" : "線OFF";
        toggleLineBtn.title = "メガホン状の線の表示を切替";
        toggleLineBtn.addEventListener("click", () => {
          equipments = equipments.map((x) =>
            x.id === equipment.id ? { ...x, coneVisible: x.coneVisible === false ? true : false } : x
          );
          applyEquipmentsState(equipments);
          renderEquipments();
          renderStage();
          renderTimeframes();
          saveStorage();
        });

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "member-delete-btn";
        deleteBtn.textContent = "✕";
        deleteBtn.type = "button";
        deleteBtn.draggable = false;
        deleteBtn.title = "カメラ・照明を削除";
        deleteBtn.addEventListener("click", () => {
          equipments = equipments.filter((x) => x.id !== equipment.id);
          stageItems = stageItems.filter((x) => x.equipmentId !== equipment.id);
          timeframes = timeframes.map((frame) => ({
            ...frame,
            stageItems: (frame.stageItems || []).filter((x) => x.equipmentId !== equipment.id),
          }));
          renderEquipments();
          renderStage();
          renderTimeframes();
          saveStorage();
        });

        row.appendChild(dot);
        row.appendChild(label);
        row.appendChild(toggleLineBtn);
        row.appendChild(deleteBtn);
        equipmentList.appendChild(row);
      });
    }

    function renderStage(animate = false) {
      const previousPositions = new Map();
      const lightingItems = getLightingItems();
      if (animate) {
        stage.querySelectorAll(".stage-item").forEach((el) => {
          const id = el.dataset.stageId;
          if (!id) return;
          previousPositions.set(id, {
            left: parseFloat(el.style.left) || 0,
            top: parseFloat(el.style.top) || 0,
          });
        });
      }

      stage.innerHTML = "";

      const applyConeStyle = (coneEl, angle, spread, length) => {
        const leftLine = coneEl.querySelector(".stage-cone-line-left");
        const rightLine = coneEl.querySelector(".stage-cone-line-right");
        if (!leftLine || !rightLine) return;

        leftLine.style.width = `${length}px`;
        rightLine.style.width = `${length}px`;
        leftLine.style.transform = `rotate(${angle - spread / 2}deg)`;
        rightLine.style.transform = `rotate(${angle + spread / 2}deg)`;
      };

      // y座標でソート（上が前に見えるようにz-indexを設定）
      const sorted = [...stageItems].sort((a, b) => a.y - b.y);
      sorted.forEach((item, index) => {
        const el = document.createElement("div");
        el.className = "stage-item";
        if (!animate) {
          el.classList.add("no-transition");
        }
        el.style.left = `${item.x}px`;
        el.style.top = `${item.y}px`;
        el.style.backgroundColor = item.color;
        el.style.zIndex = index; // y座標が小さいほど高いz-indexになる
        el.draggable = true;
        el.dataset.stageId = item.id;

        if (item.itemType !== "equipment") {
          const shadow = getMemberShadowStyle(item, lightingItems);
          el.style.filter = shadow
            ? `drop-shadow(${shadow.offsetX.toFixed(2)}px ${shadow.offsetY.toFixed(2)}px ${shadow.blur.toFixed(2)}px rgba(0, 0, 0, ${shadow.alpha.toFixed(3)}))`
            : "";
        }

        if (item.itemType === "equipment") {
          if (typeof item.coneAngle !== "number") item.coneAngle = DEFAULT_CONE.angle;
          if (typeof item.coneSpread !== "number") item.coneSpread = DEFAULT_CONE.spread;
          if (typeof item.coneLength !== "number") item.coneLength = DEFAULT_CONE.length;
          if (typeof item.coneVisible !== "boolean") item.coneVisible = true;

          const cone = document.createElement("div");
          cone.className = "stage-cone";
          cone.title = "左ドラッグ: 幅調整 / Ctrl+左クリック長押し: 向き・長さ調整";

          const leftLine = document.createElement("div");
          leftLine.className = "stage-cone-line stage-cone-line-left";
          const rightLine = document.createElement("div");
          rightLine.className = "stage-cone-line stage-cone-line-right";

          cone.appendChild(leftLine);
          cone.appendChild(rightLine);
          if (item.coneVisible) {
            applyConeStyle(cone, item.coneAngle, item.coneSpread, item.coneLength);
          } else {
            cone.style.display = "none";
          }

          const startConeAdjust = (ev) => {
            if (ev.button !== 0) return;
            ev.preventDefault();
            ev.stopPropagation();

            const mode = ev.ctrlKey ? "angle-length" : "spread";
            const startX = ev.clientX;
            const startSpread = item.coneSpread;

            const onMove = (moveEv) => {
              if (mode === "spread") {
                const dx = moveEv.clientX - startX;
                item.coneSpread = Math.max(0, Math.min(180, startSpread + dx * 0.6));
                applyConeStyle(cone, item.coneAngle, item.coneSpread, item.coneLength);
                refreshStageMemberShadows();
                return;
              }

              const rect = el.getBoundingClientRect();
              const centerX = rect.left + rect.width / 2;
              const centerY = rect.top + rect.height / 2;
              const dx = moveEv.clientX - centerX;
              const dy = moveEv.clientY - centerY;

              const angleDeg = Math.atan2(dy, dx) * 180 / Math.PI;
              const length = Math.sqrt(dx * dx + dy * dy);

              item.coneAngle = angleDeg;
              item.coneLength = Math.max(36, Math.min(460, length));
              applyConeStyle(cone, item.coneAngle, item.coneSpread, item.coneLength);
              refreshStageMemberShadows();
            };

            const onUp = () => {
              document.removeEventListener("mousemove", onMove);
              document.removeEventListener("mouseup", onUp);
              saveStorage();
            };

            document.addEventListener("mousemove", onMove);
            document.addEventListener("mouseup", onUp);
          };

          cone.addEventListener("mousedown", startConeAdjust);
          el.appendChild(cone);
        }

        if (animate) {
          const prev = previousPositions.get(item.id);
          if (prev) {
            const dx = prev.left - item.x;
            const dy = prev.top - item.y;
            if (dx !== 0 || dy !== 0) {
              el.style.transform = `translate(${dx}px, ${dy}px)`;
            }
          }
        }

        el.addEventListener("dragstart", (ev) => {
          ev.dataTransfer.setData(
            "application/json",
            JSON.stringify({ type: "stage", id: item.id })
          );
        });
        el.addEventListener("dragover", (ev) => {
          ev.preventDefault();
        });
        el.addEventListener("drop", (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          handleStageDrop(ev);
        });

        const name = document.createElement("div");
        name.className = "stage-label";
        name.textContent = item.name;
        name.style.display = toggleNames.checked ? "block" : "none";

        const deleteBtn = document.createElement("div");
        deleteBtn.className = "stage-delete-btn";
        deleteBtn.textContent = "×";
        deleteBtn.title = "削除（ダブルクリックでも削除可）";
        deleteBtn.addEventListener("click", (ev) => {
          ev.stopPropagation();
          stageItems = stageItems.filter((v) => v.id !== item.id);
          saveStorage();
          renderStage();
        });

        el.appendChild(name);
        el.appendChild(deleteBtn);

        el.addEventListener("dblclick", () => {
          stageItems = stageItems.filter((v) => v.id !== item.id);
          saveStorage();
          renderStage();
        });

        stage.appendChild(el);

        if (animate && el.style.transform) {
          requestAnimationFrame(() => {
            el.style.transform = "translate(0, 0)";
          });
        }
      });
    }

    function renderTimeframes() {
      timeframesList.innerHTML = "";
      if (timeframes.length === 0) {
        timeframesList.innerHTML = '<div class="empty-msg">フレームはまだありません</div>';
        return;
      }
      timeframes.forEach((frame, idx) => {
        const frameBtn = document.createElement("button");
        frameBtn.type = "button";
        frameBtn.className = "timeframe-btn";
        frameBtn.textContent = `${formatFrameRange(frame)}  ${frame.lyrics}`;
        frameBtn.addEventListener("click", () => {
          stageItems = frame.stageItems.map((x) => ({ ...x }));
          renderStage(true);
        });

        const editFrameBtn = document.createElement("button");
        editFrameBtn.type = "button";
        editFrameBtn.className = "timeframe-edit-btn";
        editFrameBtn.textContent = "編集";
        editFrameBtn.addEventListener("click", (ev) => {
          ev.stopPropagation();
          openTimeframeEditor(frame, editFrameBtn);
        });

        const deleteFrameBtn = document.createElement("button");
        deleteFrameBtn.type = "button";
        deleteFrameBtn.className = "timeframe-delete-btn";
        deleteFrameBtn.textContent = "✕";
        deleteFrameBtn.addEventListener("click", () => {
          timeframes = timeframes.filter((_, i) => i !== idx);
          renderTimeframes();
          saveStorage();
        });

        const frameRow = document.createElement("div");
        frameRow.className = "timeframe-row";
        frameRow.appendChild(frameBtn);
        frameRow.appendChild(editFrameBtn);
        frameRow.appendChild(deleteFrameBtn);
        timeframesList.appendChild(frameRow);
      });
    }

    function extractYoutubeVideoId(url) {
      const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
      const match = url.match(regex);
      return match ? match[1] : null;
    }

    function resolveYouTubeState(payload = {}) {
      const savedUrl = typeof payload.youtubeUrl === "string" ? payload.youtubeUrl.trim() : "";
      const savedVideoId = typeof payload.youtubeVideoId === "string" ? payload.youtubeVideoId.trim() : "";
      const derivedVideoId = savedVideoId || (savedUrl ? extractYoutubeVideoId(savedUrl) || "" : "");
      const resolvedUrl = savedUrl || (derivedVideoId ? `https://www.youtube.com/watch?v=${derivedVideoId}` : "");
      return {
        youtubeUrl: resolvedUrl,
        youtubeVideoId: derivedVideoId,
      };
    }

    function getCurrentYouTubeState() {
      const typedUrl = (youtubeUrl.value || "").trim();
      let loadedVideoId = "";

      if (player && typeof player.getVideoData === "function") {
        const data = player.getVideoData();
        loadedVideoId = data && data.video_id ? data.video_id : "";
      }

      const fallbackVideoId = typedUrl ? extractYoutubeVideoId(typedUrl) || "" : "";
      const youtubeVideoId = loadedVideoId || currentVideoId || fallbackVideoId;
      const youtubeUrlValue = typedUrl || (youtubeVideoId ? `https://www.youtube.com/watch?v=${youtubeVideoId}` : "");

      return {
        youtubeUrl: youtubeUrlValue,
        youtubeVideoId,
      };
    }

    function applyYouTubeState(payload = {}) {
      const state = resolveYouTubeState(payload);
      currentVideoId = state.youtubeVideoId;
      youtubeUrl.value = state.youtubeUrl;
    }

    function formatTime(seconds) {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${String(secs).padStart(2, "0")}`;
    }

    function fillFrameTimeFromCurrent(target) {
      if (!isPlayerReady || !player || typeof player.getCurrentTime !== "function") {
        alert("動画を読み込んでから使用してください。");
        return;
      }

      const current = Math.floor(player.getCurrentTime());
      const mins = Math.floor(current / 60);
      const secs = current % 60;

      if (target === "start") {
        frameStartMin.value = String(mins);
        frameStartSec.value = String(secs);
        return;
      }

      frameEndMin.value = String(mins);
      frameEndSec.value = String(secs);
    }

    function drawRoundedRect(ctx, x, y, width, height, radius) {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    }

    function clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }

    function getLightingItems() {
      return stageItems.filter(
        (item) => item.itemType === "equipment" && item.equipmentType === "lighting" && item.coneVisible !== false
      );
    }

    function getMemberShadowStyle(memberItem, lightingItems) {
      const memberX = memberItem.x + 16;
      const memberY = memberItem.y + 16;

      let awayDirX = 0;
      let awayDirY = 0;
      let influenceTotal = 0;

      lightingItems.forEach((light) => {
        const lightX = light.x + 16;
        const lightY = light.y + 16;
        const dx = memberX - lightX;
        const dy = memberY - lightY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 1) return;

        const coneAngle = typeof light.coneAngle === "number" ? light.coneAngle : DEFAULT_CONE.angle;
        const coneSpread = typeof light.coneSpread === "number" ? light.coneSpread : DEFAULT_CONE.spread;
        const coneLength = typeof light.coneLength === "number" ? light.coneLength : DEFAULT_CONE.length;

        const lightDirX = Math.cos((coneAngle * Math.PI) / 180);
        const lightDirY = Math.sin((coneAngle * Math.PI) / 180);
        const toMemberX = dx / distance;
        const toMemberY = dy / distance;
        const dot = clamp(lightDirX * toMemberX + lightDirY * toMemberY, -1, 1);
        const angleDiff = Math.acos(dot);
        const halfSpreadRad = ((coneSpread / 2) * Math.PI) / 180;
        const isInsideCone = angleDiff <= halfSpreadRad;
        const isWithinConeLength = distance <= coneLength;
        if (!isInsideCone || !isWithinConeLength) return;

        // 照明の2本線の内側かつ線の長さの範囲内にいる時のみ影を作る。
        // 近いほど強く、遠いほど急速に弱くなるように距離減衰を強める。
        const normalizedDistance = clamp(1 - distance / Math.max(40, coneLength), 0, 1);
        const distanceFalloff = Math.pow(normalizedDistance, 1.6);
        const normalizedAngle = clamp(1 - angleDiff / Math.max(0.1, halfSpreadRad), 0, 1);
        const influence = distanceFalloff * (0.8 + normalizedAngle * 0.8);
        if (influence <= 0) return;

        // 影の向きは常に照明から離れる方向（照明と反対方向）に限定する。
        awayDirX += toMemberX * influence;
        awayDirY += toMemberY * influence;
        influenceTotal += influence;
      });

      if (influenceTotal <= 0) return null;

      const magnitude = Math.sqrt(awayDirX * awayDirX + awayDirY * awayDirY);
      if (magnitude < 0.001) return null;

      const unitX = awayDirX / magnitude;
      const unitY = awayDirY / magnitude;
      const strength = clamp(influenceTotal, 0, 1.8);

      return {
        offsetX: unitX * (3 + strength * 5),
        offsetY: unitY * (3 + strength * 5),
        blur: 3 + strength * 5,
        alpha: 0.16 + strength * 0.2,
      };
    }

    function refreshStageMemberShadows() {
      const lightingItems = getLightingItems();
      const itemsById = new Map(stageItems.map((item) => [item.id, item]));

      stage.querySelectorAll(".stage-item").forEach((el) => {
        const item = itemsById.get(el.dataset.stageId);
        if (!item || item.itemType === "equipment") return;

        const shadow = getMemberShadowStyle(item, lightingItems);
        el.style.filter = shadow
          ? `drop-shadow(${shadow.offsetX.toFixed(2)}px ${shadow.offsetY.toFixed(2)}px ${shadow.blur.toFixed(2)}px rgba(0, 0, 0, ${shadow.alpha.toFixed(3)}))`
          : "";
      });
    }

    function downloadStageScreenshot() {
      const stageWidth = Math.max(1, Math.round(stage.clientWidth));
      const stageHeight = Math.max(1, Math.round(stage.clientHeight));
      const topLabelHeight = 24;
      const bottomLabelHeight = 24;
      const canvasWidth = stageWidth;
      const canvasHeight = stageHeight + topLabelHeight + bottomLabelHeight;
      const stageTop = topLabelHeight;

      const canvas = document.createElement("canvas");
      const scale = 2;
      canvas.width = canvasWidth * scale;
      canvas.height = canvasHeight * scale;

      const ctx = canvas.getContext("2d");
      ctx.scale(scale, scale);

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      const gradient = ctx.createLinearGradient(0, stageTop, 0, stageTop + stageHeight);
      gradient.addColorStop(0, "#f5f7fa");
      gradient.addColorStop(1, "#f5f7fa");
      drawRoundedRect(ctx, 0, stageTop, stageWidth, stageHeight, 8);
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.save();
      ctx.setLineDash([7, 5]);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#d9e0ea";
      drawRoundedRect(ctx, 1, stageTop + 1, stageWidth - 2, stageHeight - 2, 8);
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = "#666";
      ctx.font = "bold 15px 'Yu Gothic', Meiryo, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("後ろ", stageWidth / 2, topLabelHeight / 2);
      ctx.fillText("前", stageWidth / 2, stageTop + stageHeight + bottomLabelHeight / 2);

      const sorted = [...stageItems].sort((a, b) => a.y - b.y);
      const lightingItems = getLightingItems();
      sorted.forEach((item) => {
        const centerX = item.x + 16;
        const centerY = stageTop + item.y + 16;

        if (item.itemType === "equipment" && item.coneVisible !== false) {
          const coneAngle = typeof item.coneAngle === "number" ? item.coneAngle : -90;
          const coneSpread = typeof item.coneSpread === "number" ? item.coneSpread : 120;
          const coneLength = typeof item.coneLength === "number" ? item.coneLength : 96;

          const leftRad = ((coneAngle - coneSpread / 2) * Math.PI) / 180;
          const rightRad = ((coneAngle + coneSpread / 2) * Math.PI) / 180;

          const leftX = centerX + Math.cos(leftRad) * coneLength;
          const leftY = centerY + Math.sin(leftRad) * coneLength;
          const rightX = centerX + Math.cos(rightRad) * coneLength;
          const rightY = centerY + Math.sin(rightRad) * coneLength;

          ctx.save();
          ctx.lineWidth = 2;
          ctx.strokeStyle = "rgba(17, 17, 17, 0.2)";
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(leftX, leftY);
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(rightX, rightY);
          ctx.stroke();
          ctx.restore();
        }

        if (item.itemType !== "equipment") {
          const shadow = getMemberShadowStyle(item, lightingItems);
          if (shadow) {
            ctx.save();
            ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(0.3, shadow.alpha).toFixed(3)})`;
            ctx.filter = `blur(${(shadow.blur * 0.7).toFixed(2)}px)`;
            ctx.beginPath();
            ctx.ellipse(centerX + shadow.offsetX, centerY + shadow.offsetY, 10, 7, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }

        ctx.beginPath();
        ctx.arc(centerX, centerY, 16, 0, Math.PI * 2);
        ctx.fillStyle = item.color;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#ffffff";
        ctx.stroke();

        if (toggleNames.checked) {
          ctx.fillStyle = "#333";
          ctx.font = "600 10px 'Yu Gothic', Meiryo, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillText(item.name || "", centerX, centerY + 20);
        }
      });

      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `stage-${new Date().toISOString().replace(/[:.]/g, "-")}.png`;
      link.click();
    }

    function downloadConfigFile() {
      const songTitle = (songNameInput.value || "").trim();
      if (!songTitle) {
        alert("曲名が未設定です。曲名を入力してからダウンロードしてください。");
        return;
      }

      const youtubeState = getCurrentYouTubeState();

      const config = {
        songName: songTitle,
        members,
        equipments,
        stageItems,
        timeframes,
        youtubeUrl: youtubeState.youtubeUrl,
        youtubeVideoId: youtubeState.youtubeVideoId,
      };
      
      const json = JSON.stringify(config, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      const now = new Date();
      const titleRaw = songTitle;
      const title = titleRaw.replace(/[\\/:*?"<>|]/g, "_") || "untitled";
      const year = String(now.getFullYear());
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const hour = String(now.getHours()).padStart(2, "0");
      const minute = String(now.getMinutes()).padStart(2, "0");
      link.download = `${title}-${year}-${month}-${day}-${hour}-${minute}.json`;
      link.click();
      URL.revokeObjectURL(link.href);
    }

    function uploadConfigFile(file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const config = JSON.parse(e.target.result);
          if (!config.members || !Array.isArray(config.members)) {
            throw new Error("invalid-format");
          }
          
          // データを復元
          members = config.members.map((x) => ({ ...x }));
          equipments = Array.isArray(config.equipments) ? config.equipments.map((x) => ({ ...x })) : [];
          stageItems = Array.isArray(config.stageItems) ? config.stageItems.map((x) => ({ ...x })) : [];
          timeframes = Array.isArray(config.timeframes) ? config.timeframes.map((x) => ({ ...x })) : [];
          currentSong = config.songName || "";
          applyYouTubeState(config);
          
          songNameInput.value = currentSong;
          updateSongSelect();
          renderMembers();
          renderEquipments();
          renderStage();
          renderTimeframes();
          saveStorage();
          
          alert("ファイルを読み込みました。");
          uploadFile.value = "";
        } catch (err) {
          alert("ファイルの読み込みに失敗しました。正しいJSONファイルを選択してください。");
          console.error(err);
          uploadFile.value = "";
        }
      };
      reader.readAsText(file);
    }

    function applySharedState(payload) {
      members = Array.isArray(payload.members) ? payload.members.map((x) => ({ ...x })) : [];
      equipments = Array.isArray(payload.equipments) ? payload.equipments.map((x) => ({ ...x })) : [];
      stageItems = Array.isArray(payload.stageItems) ? payload.stageItems.map((x) => ({ ...x })) : [];
      timeframes = Array.isArray(payload.timeframes) ? payload.timeframes.map((x) => ({ ...x })) : [];
      currentSong = payload.songName || "";
      applyYouTubeState(payload);
      songNameInput.value = currentSong;
      updateSongSelect();
      renderMembers();
      renderEquipments();
      renderStage();
      renderTimeframes();
      saveStorage();
    }

    function applyFrameAtTime(currentTime) {
      const frameIndex = timeframes.findIndex(
        (f) => currentTime >= f.startTime && currentTime < f.endTime
      );

      if (frameIndex !== -1 && frameIndex !== lastAppliedFrameIndex) {
        lastAppliedFrameIndex = frameIndex;
        stageItems = timeframes[frameIndex].stageItems.map((x) => ({ ...x }));
        renderStage(true); // animate = true
      } else if (frameIndex === -1 && lastAppliedFrameIndex !== -1) {
        lastAppliedFrameIndex = -1;
      }
    }

    function onYouTubeIframeAPIReady() {
      // This function is called by YouTube API when it loads
    }

    function setVideoVisibility(show) {
      const iframe = player && typeof player.getIframe === "function" ? player.getIframe() : null;
      const target = iframe || youtubePlayer;
      if (!target) return;
      target.style.display = show ? "block" : "none";
    }

    function initializePlayer(videoId) {
      if (player) {
        player.destroy();
      }

      currentVideoId = videoId;

      videoDisplayMode = true;
      toggleVideoDisplay.textContent = "再生バーのみ表示";
      setVideoVisibility(true);

      player = new YT.Player(youtubePlayer, {
        height: "320",
        width: "100%",
        videoId: videoId,
        events: {
          onReady: onPlayerReady,
          onStateChange: onPlayerStateChange,
        },
      });
    }

    function onPlayerReady(event) {
      isPlayerReady = true;
      durationDisplay.textContent = formatTime(player.getDuration());
      setVideoVisibility(videoDisplayMode);
      startTimeUpdate();
    }

    function onPlayerStateChange(event) {
      if (event.data === YT.PlayerState.PLAYING) {
        isPlaying = true;
      } else if (event.data === YT.PlayerState.PAUSED) {
        isPlaying = false;
      }
    }

    function startTimeUpdate() {
      setInterval(() => {
        if (isPlayerReady && player && typeof player.getCurrentTime === "function") {
          const currentTime = player.getCurrentTime();
          currentTimeDisplay.textContent = formatTime(currentTime);
          const duration = player.getDuration();
          if (duration > 0) {
            const percent = (currentTime / duration) * 100;
            progressFill.style.width = percent + "%";
          }
          applyFrameAtTime(currentTime);
        }
      }, 100);
    }

    function getRelativePos(container, clientX, clientY) {
      const rect = container.getBoundingClientRect();
      const x = clientX - rect.left - 16;
      const y = clientY - rect.top - 16;
      return {
        x: Math.max(0, Math.min(x, rect.width - 32)),
        y: Math.max(0, Math.min(y, rect.height - 32)),
      };
    }

    function setShareHash(song) {
      if (!song) {
        history.replaceState(null, "", window.location.pathname + window.location.search);
        return;
      }
      const encoded = encodeURIComponent(song);
      location.hash = `song=${encoded}`;
    }

    function parseHash() {
      const h = location.hash.replace(/^#/, "");
      if (!h) return { song: null, share: null };
      const songMatch = h.match(/song=([^&]+)/);
      const shareMatch = h.match(/share=([^&]+)/);
      return {
        song: songMatch ? decodeURIComponent(songMatch[1]) : null,
        share: shareMatch ? decodeURIComponent(shareMatch[1]) : null,
      };
    }

    // ====== イベント ======
    openMemberManagerBtn.addEventListener("click", () => {
      openMemberManager();
    });

    openEquipmentManagerBtn.addEventListener("click", () => {
      openEquipmentManager();
    });

    addMemberRowBtn.addEventListener("click", () => {
      memberManagerDraft.push({ id: generateId(), name: "", color: "#ff0000" });
      renderMemberManagerRows();
      const inputs = memberManagerList.querySelectorAll(".member-manager-name");
      const lastInput = inputs[inputs.length - 1];
      if (lastInput) lastInput.focus();
    });

    saveMemberManagerBtn.addEventListener("click", () => {
      const nextMembers = memberManagerDraft.map((member) => ({
        ...member,
        name: (member.name || "").trim(),
        color: member.color || "#ff0000",
      }));

      if (nextMembers.some((member) => !member.name)) {
        alert("メンバー名は空にできません。");
        return;
      }

      applyMembersState(nextMembers);
      renderMembers();
      renderStage();
      saveStorage();
      closeMemberManager();
    });

    cancelMemberManagerBtn.addEventListener("click", () => {
      closeMemberManager();
    });

    closeMemberManagerBtn.addEventListener("click", () => {
      closeMemberManager();
    });

    memberManagerModal.addEventListener("click", (ev) => {
      if (ev.target === memberManagerModal) {
        closeMemberManager();
      }
    });

    addCameraRowBtn.addEventListener("click", () => {
      equipmentManagerDraft.push({ id: generateId(), name: "カメラ", type: "camera", color: "#111111", coneVisible: true });
      renderEquipmentManagerRows();
      const inputs = equipmentManagerList.querySelectorAll(".member-manager-name");
      const lastInput = inputs[inputs.length - 1];
      if (lastInput) lastInput.focus();
    });

    addLightingRowBtn.addEventListener("click", () => {
      equipmentManagerDraft.push({ id: generateId(), name: "照明", type: "lighting", color: "#f7f4e8", coneVisible: true });
      renderEquipmentManagerRows();
      const inputs = equipmentManagerList.querySelectorAll(".member-manager-name");
      const lastInput = inputs[inputs.length - 1];
      if (lastInput) lastInput.focus();
    });

    saveEquipmentManagerBtn.addEventListener("click", () => {
      const nextEquipments = equipmentManagerDraft.map((equipment) => ({
        ...equipment,
        name: (equipment.name || "").trim(),
        type: equipment.type === "lighting" ? "lighting" : "camera",
        color: getEquipmentColor(equipment),
        coneVisible: equipment.coneVisible !== false,
      }));

      if (nextEquipments.some((equipment) => !equipment.name)) {
        alert("カメラ・照明の名前は空にできません。");
        return;
      }

      applyEquipmentsState(nextEquipments);
      renderEquipments();
      renderStage();
      saveStorage();
      closeEquipmentManager();
    });

    cancelEquipmentManagerBtn.addEventListener("click", () => {
      closeEquipmentManager();
    });

    closeEquipmentManagerBtn.addEventListener("click", () => {
      closeEquipmentManager();
    });

    equipmentManagerModal.addEventListener("click", (ev) => {
      if (ev.target === equipmentManagerModal) {
        closeEquipmentManager();
      }
    });

    document.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape" && !memberManagerModal.classList.contains("hidden")) {
        closeMemberManager();
      }
      if (ev.key === "Escape" && !equipmentManagerModal.classList.contains("hidden")) {
        closeEquipmentManager();
      }
    });

    toggleNames.addEventListener("change", () => {
      renderStage();
      saveStorage();
    });

    setStartFromCurrentBtn.addEventListener("click", () => {
      fillFrameTimeFromCurrent("start");
    });

    setEndFromCurrentBtn.addEventListener("click", () => {
      fillFrameTimeFromCurrent("end");
    });

    addFrameBtn.addEventListener("click", () => {
      const startMin = parseInt(frameStartMin.value) || 0;
      const startSec = parseInt(frameStartSec.value) || 0;
      const endMin = parseInt(frameEndMin.value) || 0;
      const endSec = parseInt(frameEndSec.value) || 0;
      const lyrics = frameLyrics.value.trim();

      const startTime = startMin * 60 + startSec;
      const endTime = endMin * 60 + endSec;

      if (startTime >= endTime) {
        alert("開始時刻は終了時刻より前にしてください。");
        return;
      }

      timeframes.push({
        startTime,
        endTime,
        lyrics,
        stageItems: stageItems.map((x) => ({ ...x })),
      });

      frameStartMin.value = String(endMin);
      frameStartSec.value = String(endSec);
      frameEndMin.value = "";
      frameEndSec.value = "";
      frameLyrics.value = "";

      renderTimeframes();
      saveStorage();
    });

    loadVideoBtn.addEventListener("click", () => {
      const url = youtubeUrl.value.trim();
      if (!url) {
        alert("YouTubeのURLを入力してください。");
        return;
      }
      const videoId = extractYoutubeVideoId(url);
      if (!videoId) {
        alert("有効なYouTubeのURLではありません。");
        return;
      }
      initializePlayer(videoId);
      saveStorage();
    });

    playBtn.addEventListener("click", () => {
      if (isPlayerReady && player) {
        player.playVideo();
      }
    });

    pauseBtn.addEventListener("click", () => {
      if (isPlayerReady && player) {
        player.pauseVideo();
      }
    });

    captureStageBtn.addEventListener("click", () => {
      downloadStageScreenshot();
    });

    toggleVideoDisplay.addEventListener("click", () => {
      videoDisplayMode = !videoDisplayMode;
      setVideoVisibility(videoDisplayMode);
      toggleVideoDisplay.textContent = videoDisplayMode ? "再生バーのみ表示" : "動画を表示";
    });

    progressBar.addEventListener("click", (ev) => {
      if (!isPlayerReady || !player) return;
      const rect = progressBar.getBoundingClientRect();
      const percent = (ev.clientX - rect.left) / rect.width;
      const duration = player.getDuration();
      player.seekTo(percent * duration);
    });

    stage.addEventListener("dragover", (ev) => {
      ev.preventDefault();
    });

    function handleStageDrop(ev) {
      const txt = ev.dataTransfer.getData("application/json");
      if (!txt) return;
      const data = JSON.parse(txt);
      const pos = getRelativePos(stage, ev.clientX, ev.clientY);
      if (data.type === "member") {
        const m = members.find((x) => x.id === data.memberId);
        if (!m) return;
        stageItems.push({
          id: generateId(),
          itemType: "member",
          memberId: m.id,
          name: m.name,
          color: m.color,
          x: pos.x,
          y: pos.y,
        });
      } else if (data.type === "equipment") {
        const equipment = equipments.find((x) => x.id === data.equipmentId);
        if (!equipment) return;
        const meta = getEquipmentMeta(equipment.type);
        stageItems.push({
          id: generateId(),
          itemType: "equipment",
          equipmentId: equipment.id,
          equipmentType: equipment.type,
          name: equipment.name,
          color: equipment.color || meta.color,
          coneVisible: equipment.coneVisible !== false,
          coneAngle: DEFAULT_CONE.angle,
          coneSpread: DEFAULT_CONE.spread,
          coneLength: DEFAULT_CONE.length,
          x: pos.x,
          y: pos.y,
        });
      } else if (data.type === "stage") {
        const item = stageItems.find((x) => x.id === data.id);
        if (item) {
          item.x = pos.x;
          item.y = pos.y;
        }
      }
      saveStorage();
      renderStage();
    }

    stage.addEventListener("drop", (ev) => {
      ev.preventDefault();
      handleStageDrop(ev);
    });

    saveSongBtn.addEventListener("click", () => {
      const song = songNameInput.value.trim();
      if (!song) {
        alert("曲名を入力してください。");
        return;
      }
      songs[song] = {
        members: members.map((x) => ({ ...x })),
        equipments: equipments.map((x) => ({ ...x })),
        stageItems: stageItems.map((x) => ({ ...x })),
        timeframes: timeframes.map((frame) => ({
          ...frame,
          stageItems: (frame.stageItems || []).map((item) => ({ ...item })),
        })),
        ...getCurrentYouTubeState(),
      };
      currentSong = song;
      updateSongSelect();
      setShareHash(song);
      saveStorage();
      alert(`「${song}」を保存しました。`);
    });

    loadSongBtn.addEventListener("click", () => {
      const song = songSelect.value;
      if (!song || !songs[song]) {
        alert("読み込む曲を選んでください。");
        return;
      }
      const s = songs[song];
      members = s.members.map((x) => ({ ...x }));
      equipments = Array.isArray(s.equipments) ? s.equipments.map((x) => ({ ...x })) : [];
      stageItems = s.stageItems.map((x) => ({ ...x }));
      timeframes = Array.isArray(s.timeframes) ? s.timeframes.map((x) => ({ ...x })) : [];
      applyYouTubeState(s);
      currentSong = song;
      songNameInput.value = song;
      updateSongSelect();
      setShareHash(song);
      renderMembers();
      renderEquipments();
      renderStage();
      renderTimeframes();
      saveStorage();
    });

    deleteSongBtn.addEventListener("click", () => {
      const song = songSelect.value;
      if (!song || !songs[song]) {
        alert("曲を選択してください。");
        return;
      }
      if (!confirm(`「${song}」を削除しますか？`)) return;
      delete songs[song];
      if (currentSong === song) currentSong = "";
      updateSongSelect();
      saveStorage({ mergeExistingSongs: false });
      alert("削除しました。");
    });

    downloadBtn.addEventListener("click", () => {
      downloadConfigFile();
    });

    uploadBtn.addEventListener("click", () => {
      const file = uploadFile.files[0];
      if (!file) {
        alert("ファイルを選択してください。");
        return;
      }
      uploadConfigFile(file);
    });

    // ====== 初期化 ======
    async function init() {
      loadStorage();
      const hash = parseHash();
      if (hash.song && songs[hash.song]) {
        currentSong = hash.song;
        songNameInput.value = hash.song;
        const s = songs[hash.song];
        members = s.members.map((x) => ({ ...x }));
        equipments = Array.isArray(s.equipments) ? s.equipments.map((x) => ({ ...x })) : [];
        stageItems = s.stageItems.map((x) => ({ ...x }));
        timeframes = Array.isArray(s.timeframes) ? s.timeframes.map((x) => ({ ...x })) : [];
        applyYouTubeState(s);
      }

      if (members.length === 0) {
        members = [
          { id: generateId(), name: "A子", color: "#ff6b6b" },
          { id: generateId(), name: "B子", color: "#4d9de0" },
          { id: generateId(), name: "C子", color: "#f9c74f" },
        ];
      }

      updateSongSelect();
      renderMembers();
      renderEquipments();
      renderStage();
      renderTimeframes();
    }

    init();
