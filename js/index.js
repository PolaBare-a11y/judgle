        /**
         * =====================================================================
         * PROJECT CONFIGURATION
         * Add new projects by appending an object to this array.
         * Set `visible: false` to hide any link without deleting its config.
         *
         * Available colour themes: 'green', 'blue', 'orange', 'purple', 'teal'
         * =====================================================================
         */
        const PROJECTS = [
            {
                id: "rtinput",
                title: "Electronic Judging Interface",
                description: "Real-time execution input",
                url: "rtinput.html",
                icon: "fas fa-tablet-screen-button",
                badge: "Live",
                theme: "green",
                visible: true
            },
            {
                id: "jed",
                title: "Judge Education Designer",
                description: "Execution Overlay and Video Export",
                url: "jed.html",
                icon: "fas fa-graduation-cap",
                badge: "Education",
                theme: "blue",
                visible: true
            },
            {
                id: "qira",
                title: "Qira HD Simulator",
                description: "Qira HD Software Simulator",
                url: "qira.html",
                icon: "fas fa-bullseye",
                badge: "Simulator",
                theme: "purple",
                visible: true
            },
			 {
                id: "landings",
                title: "Landing Deductions Trainer",
                description: "Landing Deductions Trainer",
                url: "landings.html",
                icon: "fas fa-running",
                badge: "Practice",
                theme: "orange",
                visible: true
            },
            {
                id: "judgle",
                title: "Judgle",
                description: "Video execution judging practice across TRP, DMT & TUM",
                url: "judgle.html",
                icon: "fas fa-play-circle",
                badge: "Practice",
                theme: "orange",
                visible: false
            },
            {
                id: "resources",
                title: "Resources",
                description: "CJP/DD rules, reference sheets & deduction video library",
                url: "judgle.html?view=resources",
                icon: "fas fa-book-open",
                badge: "Library",
                theme: "teal",
                visible: true
            }
        ];

        const THEME_MAP = {
            green:  { color: "var(--fig-green)",   bg: "var(--fig-green-bg)" },
            blue:   { color: "var(--fig-blue)",    bg: "var(--fig-blue-bg)" },
            orange: { color: "var(--fig-orange)",  bg: "var(--fig-orange-bg)" },
            purple: { color: "var(--qira-purple)", bg: "var(--qira-purple-bg)" },
            teal:   { color: "var(--fig-teal)",    bg: "var(--fig-teal-bg)" }
        };

        function renderProjects() {
            const grid = document.getElementById("projectGrid");
            grid.innerHTML = "";

            const visibleProjects = PROJECTS.filter(project => project.visible !== false);

            visibleProjects.forEach((project, index) => {
                const palette = THEME_MAP[project.theme] || THEME_MAP.blue;

                const card = document.createElement("a");
                card.className = "project-card";
                card.href = project.url;
                card.style.setProperty("--accent-color", palette.color);
                card.style.setProperty("--accent-bg", palette.bg);
                card.style.animationDelay = `${index * 35}ms`;

                card.innerHTML = `
                    <div class="card-icon">
                        <i class="${project.icon}" aria-hidden="true"></i>
                    </div>
                    <div class="card-content">
                        <div class="card-title-row">
                            <h2>${project.title}</h2>
                            ${project.badge ? `<span class="card-badge">${project.badge}</span>` : ""}
                        </div>
                        <p>${project.description}</p>
                    </div>
                    <i class="fas fa-chevron-right card-chevron" aria-hidden="true"></i>
                `;

                grid.appendChild(card);
            });
        }

        // Theme (shared theme.js: dark / light / mono)
        const themeIcon = document.getElementById("themeIcon");
        const THEME_ICONS = { dark: "fas fa-moon", light: "fas fa-sun", mono: "fas fa-circle-half-stroke" };
        function syncThemeIcon() { themeIcon.className = THEME_ICONS[JudgleTheme.get()]; }
        document.getElementById("themeToggle").addEventListener("click", () => JudgleTheme.cycle());
        document.addEventListener("judgle-themechange", syncThemeIcon);
        syncThemeIcon();

        renderProjects();
    
