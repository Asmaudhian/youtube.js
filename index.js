 #!/usr/bin/env node
//Appel des modules node
const program = require('commander')
const inquirer = require('inquirer')
const youTube = require('youtube-node')
const qs = require('querystring')
const open = require('open')
const db = require('sqlite')
const fs = require('fs') 


//Versions différentes de l'appli
program
	.version('1.0.0')
	.option('-f, --français', 'Langue Française')
	.option('-e, --english', 'English language')

//Clé d'accès à l'api de YouTube
var youtube = new youTube
youtube.setKey('AIzaSyBpYQFksWIDKPaCOZW8PXsauP8yO5fuUZo')

//Création de la table sqlite
let promise = db.open('favTable.db')
promise.then(() => {
	console.log("Opening database")
}).then(() => {
	return db.run("CREATE TABLE IF NOT EXISTS favorite (title, videoId, description, publishedAt)")
}).then(() => {
	console.log("Creating table")
})

//Menu Principal
function menu(){
program.parse(process.argv)
	
	if (program.français) {
		langue = 'Langue : Français'
		welcome = 'Bonjour et bienvenue sur YouTube !'
		choix = ['Rechercher une vidéo', 'Favoris', 'Historique', 'Quitter']
	}

	else if (program.english) {
		langue = 'Language : English'
		welcome = 'Hello and welcome on YouTube !'
		choix = ['Search', 'Favorite', 'History', 'Quit']
	}
	else {
		program.help()
	}

	//Affiche la langue choisie
	console.log(langue)

	//Menu
	inquirer.prompt([
	{
		type:'list',
		message:welcome,
		name:'menu',
		choices:choix
	}
	]).then((answers) => {
		//Recherche de vidéo
		console.log(answers.menu)
		if (answers.menu == 'Rechercher une vidéo' || answers.menu == 'Search') {
			research()
			}
		else if(answers.menu =='Favoris' || answers.menu == 'Favorite'){
			favorite()
		}
		else if(answers.menu == 'Historique' || answers.menu == 'History'){
			history()
		}
	});
}

function research(){
	var search = []
	const j = 0
	if (program.français){
		message = 'Veuillez entrer des mots clés : '
		searched = 'Voici les résultats de la recherche : '
		choisir = 'Que voulez-vous faire avec cette vidéo ?'
		watchOrFav = ['Regarder la vidéo', 'Mettre en favoris', 'Quitter']
		placed = 'Vidéo placée dans les favoris !'
	}
	else if (program.english){
		message = 'Please enter keywords : '
		searched = 'Results : '
		choisir = 'What are you going to do ?'
		watchOrFav = ['Watch the video', 'Put it in favorite', 'Quit']
		placed = 'Video placed in favorites !'
	}
	inquirer.prompt([
	{
		type:'input',
		message: message,
		name:'search'
	}
	]).then((answers) => {
		fs.appendFile('history.txt', 'Searched : ' + answers.search +'\n', (err) => {
			if (err) throw err
		})
		youtube.search(answers.search, 10, function(error, result){
		if (error){
			console.log(error)
		}
		else{
			var j = 0
			for (var i = 0; i < 10; i++){
				search[i] = result.items[i].snippet.title
			}

			inquirer.prompt([
			{
				type: 'list',
				message: searched,
				name: 'resultats',
				choices: search
			}
			]).then((choice) => {
			while(choice.resultats != search[j])
			{
				j++
			}
			}).then(() => {
				inquirer.prompt([
				{
					type:'list',
					message: choisir,
					name:'choisir',
					choices:watchOrFav
				}]).then((response) => {
					if(response.choisir == 'Regarder la vidéo' || response.choisir == 'Watch the video'){
						open('https://www.youtube.com/watch?v=' + result.items[j].id.videoId)
						fs.appendFile('history.txt', 'Watched : ' + result.items[j].snippet.title +'\n', (err) => {
						if (err) throw err
					})
					}
					else if(response.choisir == 'Mettre en favoris' || response.choisir == 'Put it in favorite'){
						db.run('INSERT INTO favorite VALUES (?, ?, ?, ?)', result.items[j].snippet.title, result.items[j].id.videoId, result.items[j].snippet.description, result.items[j].snippet.publishedAt)
						console.log(placed)
						fs.appendFile('history.txt', 'Favorite : ' + result.items[j].snippet.title +'\n', (err) => {
						if (err) throw err
				})
					}
				})
			})

		}	
		})
	});
}

function favorite(){

	if (program.français){
		choose = 'Que voulez-vous faire ?'
	}
	else if (program.english){
		choose = 'Whatcha goona do ?'
	}

	return db.all('SELECT * FROM favorite').then((selected) => {
		var text = ''
		var l = 0
		var favs = []
		selected.forEach(function(element){
			favs[l] = element.title + '\n' + 'https://www.youtube.com/watch?v=' + element.videoId
			l++
			// text += element.title + '\n' + 'https://www.youtube.com/watch?v=' + element.videoId + '\n' + element.description + '\n' + element.publishedAt + '\n\n'
		})
			inquirer.prompt([
			{
				type:'list',
				message:choose,
				name:'choosen',
				choices:favs
			}]).then((choixFav) => {
				console.log(choixFav)

				// REPRENDRE ICI POUR LA LISTE FAVORIS
			})

})
}
function history(){
	fs.readFile('history.txt', 'utf8', (err, data) => {
		if(err) throw err
		console.log('History : ' + '\n' + data)
	})
}
menu()
// rl.close();