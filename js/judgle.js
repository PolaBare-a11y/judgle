        

		// Predefined video data with correct answers and explanations for each video
        /* videoData now lives in data/videos.js */
		// Resource Library Data
		/* resourceData now lives in data/resources.js */
		// Valid entries for each box
        const validEntries = {
            first10: [0, 1, 2, 3, 4, 5],
            lastBox: [0, 1, 2, 3, 5, 10]
        };
		
		const videoKeys = Object.keys(videoData);
		currentVideoId = videoKeys[videoKeys.length - 1]; // Last video
		let activeTagFilters = [];

		
		window.onload = () => {
			const availableVideos = getAvailableVideos();

			currentVideoId = availableVideos[availableVideos.length-1];
			loadVideo(currentVideoId);
			populateHistoryList();
			initializeResourceLibrary();

			// Check URL parameter for direct resource library access
			const urlParams = new URLSearchParams(window.location.search);
			if (urlParams.get('view') === 'resources') {
				// Open resource library directly
				const resourceLibrary = document.getElementById('resourceLibrary');
				const mainContent = document.getElementById('mainContent');
				mainContent.style.display = 'none';
				resourceLibrary.classList.remove('hidden');
				resourceLibrary.classList.add('fade-in');
			}
		};
		
		function toggleHelpMenu() {
			const helpMenu = document.getElementById("helpMenu");

			if (helpMenu.classList.contains("show")) {
				helpMenu.classList.remove("show");
				setTimeout(() => {
					helpMenu.style.display = "none";
				}, 100); // Wait for fade-out before hiding
			} else {
				helpMenu.style.display = "block";
				setTimeout(() => {
					helpMenu.classList.add("show");
				}, 10); // Small delay to trigger fade-in
			}
		}

		// Resource Library Functions
		function toggleResourceLibrary() {
			const resourceLibrary = document.getElementById('resourceLibrary');
			const mainContent = document.getElementById('mainContent');
			
			if (resourceLibrary.classList.contains('hidden')) {
				// Show resource library
				mainContent.classList.add('fade-out');
				setTimeout(() => {
					mainContent.style.display = 'none';
					resourceLibrary.classList.remove('hidden');
					resourceLibrary.classList.add('fade-in');
					// Update URL without reloading page
					history.pushState({view: 'resources'}, '', '?view=resources');
				}, 300);
			} else {
				// Show main content
				resourceLibrary.classList.remove('fade-in');
				resourceLibrary.classList.add('fade-out');
				setTimeout(() => {
					resourceLibrary.classList.add('hidden');
					resourceLibrary.classList.remove('fade-out');
					mainContent.style.display = 'block';
					mainContent.classList.remove('fade-out');
					mainContent.classList.add('fade-in');
					// Update URL to remove parameter
					history.pushState({view: 'quiz'}, '', window.location.pathname);
				}, 300);
			}
		}

		// Handle browser back/forward buttons
		window.addEventListener('popstate', function(event) {
			const resourceLibrary = document.getElementById('resourceLibrary');
			const mainContent = document.getElementById('mainContent');
			const urlParams = new URLSearchParams(window.location.search);
			
			if (urlParams.get('view') === 'resources') {
				// Show resources
				if (resourceLibrary.classList.contains('hidden')) {
					mainContent.style.display = 'none';
					resourceLibrary.classList.remove('hidden');
					resourceLibrary.classList.add('fade-in');
				}
			} else {
				// Show main content
				if (!resourceLibrary.classList.contains('hidden')) {
					resourceLibrary.classList.add('hidden');
					mainContent.style.display = 'block';
					mainContent.classList.add('fade-in');
				}
			}
		});

		function initializeResourceLibrary() {
			generateTagFilters();
			renderResources();
		}

		function generateTagFilters() {
			const allTags = new Set();
			resourceData.forEach(resource => {
				resource.tags.forEach(tag => allTags.add(tag));
			});

			const tagFiltersContainer = document.getElementById('tagFilters');
			tagFiltersContainer.innerHTML = '';

			allTags.forEach(tag => {
				const tagButton = document.createElement('button');
				tagButton.className = 'tag-filter-btn';
				tagButton.textContent = tag;
				tagButton.onclick = () => toggleTagFilter(tag, tagButton);
				tagFiltersContainer.appendChild(tagButton);
			});
		}

		function toggleTagFilter(tag, button) {
			if (activeTagFilters.includes(tag)) {
				activeTagFilters = activeTagFilters.filter(t => t !== tag);
				button.classList.remove('active');
			} else {
				activeTagFilters.push(tag);
				button.classList.add('active');
			}
			renderResources();
		}

		function clearTagFilters() {
			activeTagFilters = [];
			document.querySelectorAll('.tag-filter-btn').forEach(btn => {
				btn.classList.remove('active');
			});
			renderResources();
		}

		function renderResources() {
			const resourceGrid = document.getElementById('resourceGrid');
			resourceGrid.innerHTML = '';

			// Filter resources
			let filteredResources = resourceData;
			if (activeTagFilters.length > 0) {
				filteredResources = resourceData.filter(resource => 
					activeTagFilters.some(tag => resource.tags.includes(tag))
				);
			}

			// Sort: unwatched first, then watched
			const watchedStatus = JSON.parse(localStorage.getItem('watchedResources')) || {};
			filteredResources.sort((a, b) => {
				const aWatched = watchedStatus[a.id] || false;
				const bWatched = watchedStatus[b.id] || false;
				return aWatched - bWatched;
			});

			// Render resources
			filteredResources.forEach(resource => {
				const resourceCard = createResourceCard(resource, watchedStatus[resource.id] || false);
				resourceGrid.appendChild(resourceCard);
			});

			if (filteredResources.length === 0) {
				resourceGrid.innerHTML = '<p class="no-resources">No resources match the selected filters.</p>';
			}
		}

		function createResourceCard(resource, isWatched) {
			const card = document.createElement('div');
			card.className = 'resource-card';
			if (isWatched) card.classList.add('watched');

			const watchIcon = document.createElement('div');
			watchIcon.className = 'watch-status';
			watchIcon.innerHTML = isWatched ? '<i class="fas fa-check-circle"></i>' : '<i class="far fa-circle"></i>';
			watchIcon.onclick = () => toggleWatchStatus(resource.id);

			const title = document.createElement('h3');
			title.textContent = resource.title;

			const description = document.createElement('p');
			description.className = 'resource-description';
			description.textContent = resource.description;

			const tagsContainer = document.createElement('div');
			tagsContainer.className = 'resource-tags';
			resource.tags.forEach(tag => {
				const tagSpan = document.createElement('span');
				tagSpan.className = 'resource-tag';
				tagSpan.textContent = tag;
				tagsContainer.appendChild(tagSpan);
			});

			let contentElement;
			if (resource.type === 'video') {
				contentElement = document.createElement('div');
				contentElement.className = 'resource-video';
				contentElement.innerHTML = `
					<iframe 
						src="https://www.youtube.com/embed/${resource.videoId}" 
						frameborder="0" 
						allowfullscreen
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
					></iframe>
				`;
			} else if (resource.type === 'pdf') {
				contentElement = document.createElement('a');
				contentElement.className = 'resource-link';
				contentElement.href = resource.url;
				contentElement.target = '_blank';
				contentElement.innerHTML = '<i class="fas fa-file-pdf"></i> Open PDF';
			} else if (resource.type === 'link') {
				contentElement = document.createElement('a');
				contentElement.className = 'resource-link';
				contentElement.href = resource.url;
				contentElement.target = '_blank';
				contentElement.innerHTML = '<i class="fas fa-external-link-alt"></i> Open Link';
			}

			card.appendChild(watchIcon);
			card.appendChild(title);
			card.appendChild(description);
			card.appendChild(tagsContainer);
			card.appendChild(contentElement);

			return card;
		}

		function toggleWatchStatus(resourceId) {
			const watchedStatus = JSON.parse(localStorage.getItem('watchedResources')) || {};
			watchedStatus[resourceId] = !watchedStatus[resourceId];
			localStorage.setItem('watchedResources', JSON.stringify(watchedStatus));
			renderResources();
		}

		function copyResourceLink() {
			const url = window.location.origin + window.location.pathname + '?view=resources';
			navigator.clipboard.writeText(url).then(() => {
				// Show a temporary success message
				const btn = document.querySelector('.share-link-btn');
				const originalHTML = btn.innerHTML;
				btn.innerHTML = '<i class="fas fa-check"></i> Link Copied!';
				btn.style.background = '#28a745';
				setTimeout(() => {
					btn.innerHTML = originalHTML;
					btn.style.background = '';
				}, 2000);
			}).catch(err => {
				// Fallback for older browsers
				alert('Copy this link: ' + url);
			});
		}
						
		// Get available videos (released ones)
		function getAvailableVideos() {
			const today = new Date().toLocaleDateString('en-CA'); // Get today's date in YYYY-MM-DD format
			return Object.keys(videoData).filter(videoId => videoData[videoId].releaseDate <= today);
		}
		
		function toggleMode() {
            JudgleTheme.cycle();
        }

		// Load the selected video and corresponding range data
        function loadVideo(videoId) {
            const video = videoData[videoId];
            const videoPlayer = document.getElementById('videoPlayer');
            videoPlayer.innerHTML = `<iframe src="${video.src}"
					frameborder="0"
					allowfullscreen
					>
					</iframe>`;
			
			currentVideoId = videoId
			
			// Remove 'active' class from all videos
			document.querySelectorAll('.video-item').forEach(item => {
				item.classList.remove('active');
			});

			// Add 'active' class to selected video
			document.querySelectorAll('.video-item').forEach(item => {
			if (item.textContent.trim() === formatVideoTitle(videoId)) {
				item.classList.add('active');
			}
			});
			
			
			document.getElementById('videoPlayer').classList.add('fade-in');
            videoPlayer.classList.add('fade-in');
            inputContainer.innerHTML = ''; // Clear previous inputs
            for (let i = 0; i < video.correctAnswers.length; i++) {
                //const wrapper = document.createElement('div');
				//wrapper.classList.add('flip-wrapper');

				const input = document.createElement('input');
                input.type = 'number';
                input.className = 'input-box';
                input.id = `input${i+1}`;
                input.min = video.ranges[i].min;
                input.max = video.ranges[i].max;
                input.addEventListener('input', autoTab);
                input.addEventListener('input', validateInput);
				if (i === video.correctAnswers.length-1) {
                    input.addEventListener('keypress', function(event) {
                        if (event.key === 'Enter') {
                            event.preventDefault();
                            document.getElementById('submitButton').click();
                        }
                    });
                }
                //wrapper.appendChild(input)
				inputContainer.appendChild(input);
            }
			
			hideResults();
			// Set focus to the first input field
				setTimeout(() => {
					const firstInput = document.getElementById('input1');
					if (firstInput) firstInput.focus();
				}, 300); // Small delay ensures elements are fully loaded before focusing

        }

        // Auto Tab functionality - Move to next input box on enter (if valid)
        function autoTab(event) {
            const currentInput = event.target;
            if (!validateInput(event) || currentInput.value === "") {
                return; // Don't tab if invalid or empty
            }

            const nextInput = currentInput.nextElementSibling;
            if (nextInput && nextInput.classList.contains('input-box')) {
                nextInput.focus();
            }
        }

        // Validate input to ensure it is in the allowed range
        function validateInput(event) {
            const currentInput = event.target;
            let validValues;

            if (currentInput.id === 'input11') {
                validValues = validEntries.lastBox;
            } else {
                validValues = validEntries.first10;
            }

            const isValid = validValues.includes(parseInt(currentInput.value));
            if (isValid) {
                currentInput.setCustomValidity("");
            } else {
                currentInput.setCustomValidity("Invalid value");
            }

            return isValid;
        }

        function hideResults() {
			document.getElementById('answerTable').style.display = 'none';
			document.getElementById('result').innerText = '';
			// Reset the table and result display
			document.getElementById('answerTableBody').innerHTML = '';
		}
		
		function toggleVideoHistory() {
			const hiddenVideos = document.getElementById('hiddenVideos');
			const historyButton = document.getElementById('historyButton');

			if (hiddenVideos.style.display === "none") {
				hiddenVideos.style.display = "block";
				setTimeout(() => hiddenVideos.classList.add('show'), 10);
				//historyButton.innerText = "Hide All";
			} else {
				hiddenVideos.classList.remove('show');
				setTimeout(() => hiddenVideos.style.display = "none", 500);
				//historyButton.innerText = "View All";
			}
		}
		
		
		// Check answers and show results
        function checkAnswers() {
            const video = videoData[currentVideoId]; // Get the currently selected video
			if (!video) return; // Safety check
           
			
			let allFilled = video.correctAnswers.length>0;
			
			// Check if all input fields are filled
			for (let i = 0; i < video.correctAnswers.length; i++) {
				const input = document.getElementById(`input${i+1}`);
				if (!input || input.value.trim() === "") {
					allFilled = false;
					break;
				}
			}

			if (!allFilled) {
				const warning = document.getElementById("warningMessage");
				warning.classList.add("show"); // Make it visible

				// Remove after 5 seconds
				setTimeout(() => {
					warning.classList.remove("show");
				}, 5000);

				return;
			}
			
			
			
			const userAnswers = [];
            let correctCount = 0;

            // Clear previous answer tables and explanations
            document.getElementById('answerTableBody').innerHTML = '';
            const answerTable = document.getElementById('answerTable');
            answerTable.style.display = 'table'; // Show the answer table

            // Loop over all inputs and evaluate answers
            video.correctAnswers.forEach((correctAnswer, index) => {
                const userAnswer = parseInt(document.getElementById(`input${index + 1}`).value);
                const input = document.getElementById(`input${index + 1}`);
                const answerText = document.getElementById(`answer${index + 1}`);
				let tableText = 'Element'
                let rowClass = 'incorrect-row';
				let inputClass = 'default';
                let explanation = video.explanations[index];

                if (userAnswer === correctAnswer) {
                    rowClass = 'correct-row';
                    correctCount++;
					inputClass = 'correct';
                } else if (userAnswer >= video.ranges[index].min && userAnswer <= video.ranges[index].max) {
                    rowClass = 'close-row';
					inputClass = 'close';
                }
				
				 // Apply flip animation dynamically
				//input.classList.add('flip');
				//input.style.animationDelay = `${(index+1) * 100}ms`;
				
				
				if (index === 10) { tableText='Landing';} else { tableText = 'Element '+(index+1);}
				
				// Update the input field's class
				input.className = `input-box ${inputClass}`;
				
                // Add to the answer table
                const row = document.createElement('tr');
                row.className = rowClass;
                row.innerHTML = `<td>${tableText}</td>
                                 <td>${userAnswer}</td>
                                 <td>${correctAnswer}</td>
                                 <td>${explanation}</td>`;
                document.getElementById('answerTableBody').appendChild(row);
            });

            // Show the result summary
            // document.getElementById('result').innerText = `You got ${correctCount} out of 11 correct.`;
        }
		function restartQuiz() {
			document.querySelectorAll('.input-box').forEach(input => {
			input.value = '';
			input.className = 'input-box';
			});
		document.getElementById('result').innerText = '';
		document.getElementById('answerTable').style.display = 'none';
		}

		function populateHistoryList() {
			const hiddenVideosContainer = document.getElementById('hiddenVideos');
			const latestVideoContainer = document.getElementById('latestVideoContainer');
			hiddenVideosContainer.innerHTML = ""; // Clear existing history list
			latestVideoContainer.innerHTML = ""; // Clear latest video (prevents duplication)

			const videoKeysToLoad = getAvailableVideos().reverse(); // Reverse order
			const latestVideoId = videoKeysToLoad[0]; // Get the latest video

			// Create the latest video item dynamically
			const latestVideoItem = document.createElement('div');
			latestVideoItem.className = 'video-item active'; // Mark as active
			latestVideoItem.onclick = () => loadVideo(latestVideoId);
			latestVideoItem.innerHTML = `<p>${formatVideoTitle(latestVideoId)}</p>`; // Dynamic title

			latestVideoContainer.appendChild(latestVideoItem); // Insert into list

			// Populate history list, excluding the latest video
			videoKeysToLoad.slice(1).forEach(videoId => {
				const videoItem = document.createElement('div');
				videoItem.className = 'video-item';
				videoItem.onclick = () => loadVideo(videoId);
				videoItem.innerHTML = `<p>${formatVideoTitle(videoId)}</p>`;
				hiddenVideosContainer.appendChild(videoItem);
			});
			

		}	

		function formatVideoTitle(videoId) {
			return videoData[videoId].title;
		}
		
		function goHome() {
			// Hide resource library if it's open
			const resourceLibrary = document.getElementById('resourceLibrary');
			const mainContent = document.getElementById('mainContent');
			
			if (!resourceLibrary.classList.contains('hidden')) {
				resourceLibrary.classList.add('hidden');
				mainContent.style.display = 'block';
			}
			
			// Close video history if it's open
			const hiddenVideos = document.getElementById('hiddenVideos');
			if (hiddenVideos.style.display !== 'none') {
				hiddenVideos.classList.remove('show');
				hiddenVideos.style.display = 'none';
			}
			
			// Reset quiz answers
			restartQuiz();
			
			// Load the latest video
			const availableVideos = getAvailableVideos();
			const latestVideoId = availableVideos[availableVideos.length - 1];
			loadVideo(latestVideoId);
			
			// Update URL to remove any parameters
			history.pushState({view: 'quiz'}, '', window.location.pathname);
			
			// Scroll to top
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
		

    
