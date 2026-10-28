(() => {
    const definitions = {
        garden: { number: 1, challenge: 3, label: "Fragmento criptografado 1" },
        refuge: { number: 2, challenge: 5, label: "Fragmento criptografado 2" },
        laboratory: { number: 3, challenge: 6, label: "Fragmento criptografado 3" },
        teleport: { number: 4, challenge: 7, label: "Fragmento criptografado 4" }
    };
    const fragmentState = assets.get("encryptedFiles");
    const collected = Array.isArray(fragmentState)
        ? [...new Set(fragmentState.filter((id) => Number.isInteger(id) && id >= 1 && id <= 4))]
        : [];
    const item = definitions[document.body.dataset.encryptedFile];
    const inventory = document.createElement("aside");
    inventory.className = "encrypted-inventory";
    inventory.setAttribute("aria-label", "Inventário de arquivos criptografados");
    document.body.appendChild(inventory);

    function renderInventory() {
        inventory.replaceChildren();
        const heading = document.createElement("strong");
        heading.textContent = `ARQUIVOS ${collected.length}/4`;
        inventory.appendChild(heading);
        if (assets.get("admin-key-available")) {
            const adminStatus = document.createElement("span");
            adminStatus.className = assets.get("have-admin-file")
                ? "encrypted-admin-status"
                : "encrypted-admin-status is-lost";
            adminStatus.textContent = assets.get("have-admin-file")
                ? "ADM: ATIVO"
                : "ADM: PERDIDO — fale com Célio";
            inventory.appendChild(adminStatus);
        }
        const slots = document.createElement("div");
        slots.className = "encrypted-inventory-slots";
        for (let number = 1; number <= 4; number += 1) {
            const slot = document.createElement("span");
            slot.className = collected.includes(number)
                ? "encrypted-inventory-slot is-collected"
                : "encrypted-inventory-slot";
            slot.textContent = collected.includes(number) ? String(number) : "?";
            slot.setAttribute("aria-label", collected.includes(number)
                ? `Fragmento ${number} coletado`
                : `Fragmento ${number} ainda não coletado`);
            slots.appendChild(slot);
        }
        inventory.appendChild(slots);
    }

    function refreshItem() {
        if (!item || collected.includes(item.number)) {
            return;
        }
        const completed = assets.get("completedChallenges");
        if (!Array.isArray(completed) || !completed.includes(item.challenge)) {
            return;
        }

        const file = document.createElement("button");
        file.type = "button";
        file.className = "encrypted-file";
        file.setAttribute("aria-label", `Coletar ${item.label}`);
        file.innerHTML = `
            <img src="assets/sprites/SpriteSheets/code.png" alt="">
            <span class="encrypted-file-label">${item.label}</span>
            <span class="encrypted-file-prompt">Clique para coletar</span>`;
        file.addEventListener("click", () => {
            if (collected.includes(item.number)) {
                return;
            }
            collected.push(item.number);
            collected.sort((left, right) => left - right);
            assets.save("encryptedFiles", collected);
            file.remove();
            renderInventory();
            document.dispatchEvent(new CustomEvent("kat:encrypted-file-collected", {
                detail: { number: item.number }
            }));
        }, { once: true });
        document.body.appendChild(file);
    }

    renderInventory();
    refreshItem();
    document.addEventListener("kat:challenge-complete", refreshItem);
    document.addEventListener("kat:admin-access-lost", renderInventory);
    document.addEventListener("kat:admin-access-restored", renderInventory);

    window.encryptedFiles = {
        collected: (number) => collected.includes(number),
        count: () => collected.length,
        allCollected: () => collected.length === 4
    };
})();
