(() => {
    if (typeof scene === "undefined" || typeof scene.createPortal !== "function") {
        throw new Error("Teleport points require an initialized SceneManager.");
    }

    window.teleportPoints = {
        create: ({ direction, to, label, canTeleport }) => {
            if (typeof label !== "string" || label.trim() === "") {
                throw new TypeError("Teleport point labels must be non-empty strings.");
            }

            const point = scene.createPortal(direction);
            point.element.classList.remove("portal-object");
            point.element.classList.add("teleport-point");
            point.element.style.width = "64px";
            point.element.style.height = "64px";
            point.element.style.zIndex = "9997";
            point.element.style.backgroundImage = "none";
            point.element.setAttribute("aria-label", `Teletransporte para ${label}`);

            const destination = document.createElement("span");
            destination.className = "teleport-destination-label";
            destination.dataset.direction = direction;
            destination.textContent = label;
            point.element.appendChild(destination);

            point.teleport({ to, on: "interact", canTeleport });
            return point;
        },
        createStoryPortal: ({
            direction,
            to,
            destinations,
            canTeleport,
            recoveryTo = "marketplace.html"
        }) => {
            if (to != null && (typeof to !== "string" || to.trim() === "")) {
                throw new TypeError("Story portal destinations must be non-empty strings.");
            }
            if (destinations != null &&
                (!Array.isArray(destinations) || destinations.length === 0)) {
                throw new TypeError("Story portal destinations must be a non-empty array.");
            }
            const destinationOptions = destinations || [];
            destinationOptions.forEach((destination) => {
                if (!destination || typeof destination !== "object" ||
                    typeof destination.to !== "string" || destination.to.trim() === "" ||
                    typeof destination.label !== "string" || destination.label.trim() === "" ||
                    (destination.canTeleport != null &&
                        typeof destination.canTeleport !== "function")) {
                    throw new TypeError("Each story portal destination needs a path, label, and optional permission check.");
                }
            });
            if (to == null && destinationOptions.length === 0) {
                throw new TypeError("A story portal needs a destination or destination options.");
            }
            if (canTeleport != null && typeof canTeleport !== "function") {
                throw new TypeError("Story portal canTeleport must be a function.");
            }

            const normalCanTeleport = canTeleport || (() => true);
            const isRecoveringAdmin = () => assets.get("admin-access-lost") === true;
            const point = scene.createPortal(direction).teleport({
                to: to || destinationOptions[0].to,
                on: "interact",
                canTeleport: () => isRecoveringAdmin()
                    ? Boolean(recoveryTo)
                    : normalCanTeleport()
            });
            point.normalDestination = to || destinationOptions[0].to;
            point.recoveryDestination = recoveryTo;
            point.destinationOptions = destinationOptions;
            point.resolveDestination = () => {
                if (isRecoveringAdmin()) {
                    return recoveryTo || null;
                }
                if (destinationOptions.length === 0) {
                    return point.destination;
                }

                const available = destinationOptions.filter((destination) =>
                    !destination.canTeleport || destination.canTeleport()
                );
                if (available.length === 0) {
                    return null;
                }
                if (available.length === 1) {
                    point.destination = available[0].to;
                    return available[0].to;
                }

                const previousControlsDisabled = framer.controlsDisabled;
                const overlay = document.createElement("section");
                overlay.className = "portal-destination-picker";
                overlay.setAttribute("role", "dialog");
                overlay.setAttribute("aria-modal", "true");
                overlay.setAttribute("aria-labelledby", "portal-destination-title");

                const panel = document.createElement("div");
                panel.className = "portal-destination-picker-panel";
                const title = document.createElement("h2");
                title.id = "portal-destination-title";
                title.textContent = "ESCOLHA UM SETOR";
                const description = document.createElement("p");
                description.textContent = "Para onde você deseja ir?";
                const options = document.createElement("div");
                options.className = "portal-destination-options";

                const closePicker = () => {
                    overlay.remove();
                    framer.controlsDisabled = previousControlsDisabled;
                    window.removeEventListener("keydown", handlePickerKeydown);
                };
                const handlePickerKeydown = (event) => {
                    if (event.key === "Escape") {
                        closePicker();
                    }
                };

                available.forEach((destination) => {
                    const button = document.createElement("button");
                    button.type = "button";
                    button.className = "portal-destination-option";
                    button.textContent = destination.label;
                    button.addEventListener("click", () => {
                        if (destination.canTeleport && !destination.canTeleport()) {
                            return;
                        }
                        closePicker();
                        point.destination = destination.to;
                        point.teleportTo(destination.to);
                    });
                    options.appendChild(button);
                });

                const cancel = document.createElement("button");
                cancel.type = "button";
                cancel.className = "portal-destination-cancel";
                cancel.textContent = "VOLTAR";
                cancel.addEventListener("click", closePicker);

                panel.append(title, description, options, cancel);
                overlay.appendChild(panel);
                document.body.appendChild(overlay);
                framer.controlsDisabled = true;
                window.addEventListener("keydown", handlePickerKeydown);
                const firstOption = options.querySelector("button");
                if (firstOption) {
                    firstOption.focus();
                }
                return null;
            };
            point.teleportTo = null;
            if (isRecoveringAdmin() && recoveryTo) {
                point.destination = recoveryTo;
            }
            return point;
        }
    };
})();
