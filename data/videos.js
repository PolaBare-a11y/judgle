/* JUDGLE QUIZ VIDEOS - add or edit quiz videos here (releaseDate controls when each appears). */
const videoData = {
            vid1: {
                src: "https://www.youtube.com/embed/qkfBtD3IbNw",
                correctAnswers: [1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 10],
                explanations: [
                    "Explanation for answer 1...",
                    "Explanation for answer 2...",
                    "Explanation for answer 3...",
                    "Explanation for answer 4...",
                    "Explanation for answer 5...",
                    "Explanation for answer 6...",
                    "Explanation for answer 7...",
                    "Explanation for answer 8...",
                    "Explanation for answer 9...",
                    "Explanation for answer 10...",
                    "Explanation for the final answer"
                ],
                ranges: [
                    { min: 0, max: 1 },
                    { min: 1, max: 2 },
                    { min: 2, max: 3 },
                    { min: 3, max: 4 },
                    { min: 4, max: 5 },
                    { min: 1, max: 1 },
                    { min: 2, max: 2 },
                    { min: 3, max: 3 },
                    { min: 4, max: 4 },
                    { min: 5, max: 5 },
                    { min: 10, max: 10 }
                ],
		title: "2025-03-01 (TRA)",
		releaseDate: "2025-03-01"
            },
            vid2: {
                src: "https://www.youtube.com/embed/KAgB7tq25GI",
                correctAnswers: [1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1],
                explanations: [
                    "Explanation for answer 1...",
                    "Explanation for answer 2...",
                    "Explanation for answer 3...",
                    "Explanation for answer 4...",
                    "Explanation for answer 5...",
                    "Explanation for answer 6...",
                    "Explanation for answer 7...",
                    "Explanation for answer 8...",
                    "Explanation for answer 9...",
                    "Explanation for answer 10...",
                    "Explanation for the final answer"
                ],
                ranges: [
                    { min: 0, max: 1 },
                    { min: 1, max: 2 },
                    { min: 2, max: 3 },
                    { min: 3, max: 4 },
                    { min: 4, max: 5 },
                    { min: 1, max: 1 },
                    { min: 2, max: 2 },
                    { min: 3, max: 3 },
                    { min: 4, max: 4 },
                    { min: 5, max: 5 },
                    { min: 5, max: 10 }
                ],
		title: "2025-03-08 (TRA)",
		releaseDate: "2025-03-08"
            },
	vid3: {
                src: "https://www.youtube.com/embed/K-0Cl0o_qx4",
                correctAnswers: [3, 4, 0],
                explanations: [
                    "Explanation for answer 1...",
                    "Explanation for answer 2...",
                    "Explanation for answer 3..."
                ],
                ranges: [
                    { min: 3, max: 4 },
                    { min: 3, max: 4 },
                    { min: 0, max: 0 }
                ],
		title: "2025-03-12 (DMT)",
		releaseDate: "2025-03-17"
            },
	vid4: {
                src: "https://www.youtube.com/embed/_lRiCGFKKrY",
                correctAnswers: [1,3,2,3,2,3,3,5,2],
                explanations: [
                    "Explanation for answer 1...",
                    "Explanation for answer 2...",
			"Explanation for answer 3...",
			"Explanation for answer 4...",
			"Explanation for answer 5...",
			"Explanation for answer 6...",
			"Explanation for answer 7...",
			"Explanation for answer 8...",
                    "Explanation for answer 9..."
                ],
                ranges: [
                    { min: 1, max: 1 },
			{ min: 3, max: 3 },
			{ min: 2, max: 3 },
			{ min: 3, max: 3 },
			{ min: 2, max: 3 },
                    { min: 3, max: 3 },
			{ min: 3, max: 3 },
			{ min: 5, max: 5 },
                    { min: 0, max: 2 }
                ],
		title: "2025-03-17 (TUM)",
		releaseDate: "2025-03-17"
            }
        };
