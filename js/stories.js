"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

// This is the list of favorite stories only, an instance of StoryList
let favStoryList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
	storyList = await StoryList.getStories();
	$storiesLoadingMsg.remove();

	putStoriesOnPage();
}

/** Get and show favorite stories only when clicking "favorites" on the nav bar. */

async function getAndPrepareFavs() {
	favStoryList = await StoryList.getFavs();
	$storiesLoadingMsg.remove();

	prepareFavsHTML();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story) {
	// console.debug("generateStoryMarkup", story);
	let favStar = "&star;";
	let favStarClass = "favStar-empty";
	if (currentUser.favorites.find((fav) => fav.storyId === story.storyId)) {
		favStar = "&starf;";
		favStarClass = "favStar-filled";
	}
	const hostName = story.getHostName(story.url);
	return $(`
      <li id="${story.storyId}">
        <a class="favStar ${favStarClass}">${favStar}</a>
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
        <button class="remove-story">remove</button>
      </li>
    `);
}

function generateFavMarkup(fav) {
	// console.debug("generateFavMarkup", fav);
	const hostName = fav.getHostName(fav.url);
	return $(`
      <li id="fav-${fav.storyId}">
        <a href="${fav.url}" target="a_blank" class="story-link">
          ${fav.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${fav.author}</small>
        <small class="story-user">posted by ${fav.username}</small>
      </li>
    `);
}

/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
	console.debug("putStoriesOnPage");

	$allStoriesList.empty();

	// loop through all of our stories and generate HTML for them
	for (let story of storyList.stories) {
		const $story = generateStoryMarkup(story);
		$allStoriesList.append($story);
	}

	$allStoriesList.show();
}

/** Gets list of favorite stories from server, generates their HTML, and puts on page. */

function prepareFavsHTML() {
	console.debug("prepareFavsHTML");

	$favStoriesList.empty();

	// loop through all of our stories and generate HTML for them
	for (let fav of favStoryList.stories) {
		const $fav = generateFavMarkup(fav);
		$favStoriesList.append($fav);
	}
}

/** Gets input values from add story form, calls storyList.addStory, generates HTML, and puts on page. */

async function newStoryOnPage(evt) {
	console.debug("newStoryOnPage", evt);
	evt.preventDefault();

	const title = $("#story-title").val();
	const author = $("#story-author").val();
	const url = $("#story-url").val();

	const story = await storyList.addStory(currentUser, { author, title, url });

	hidePageComponents();
	await getAndShowStoriesOnStart();
	await getAndPrepareFavs();
}

$storyAddForm.on("submit", newStoryOnPage);

/** If the star next to a story is clicked, calls the User method to add/remove favorite. */

async function clickFavStar(evt) {
	if (evt.target.classList.contains("favStar-empty")) {
		const response = await currentUser.addFavorite(
			currentUser,
			evt.target.parentNode.id
		);
	} else if (evt.target.classList.contains("favStar-filled")) {
		const response = await currentUser.removeFavorite(
			currentUser,
			evt.target.parentNode.id
		);
	} else {
		console.log("ran nothing, just returned");
		return;
	}

	await checkForRememberedUser();
	hidePageComponents();
	await getAndShowStoriesOnStart();
	await getAndPrepareFavs();
}

$body.on("click", ".favStar", clickFavStar);

/** If the remove button is clicked, delete the parent li from DOM and send delete request to API. */

async function clickRemoveStory(evt) {
	const parentLi = evt.target.parentElement;

	const response = await StoryList.deleteStory(currentUser, parentLi.id);

	parentLi.remove();
}

$body.on("click", ".remove-story", clickRemoveStory);
