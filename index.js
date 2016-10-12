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
	return db.run("CREATE TABLE IF NOT EXISTS favorite (title, videoId, description, publishedAt)")
})

//Menu Principal
function menu(){
program.parse(process.argv)
	
	// Les variables contiennent le texte à afficher en fonction de la version
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

	//Menu principal
	inquirer.prompt([
	{
		type:'list',
		message:welcome,
		name:'menu',
		choices:choix
	}
	]).then((answers) => {
		// Redirection vers la fonction choisie dans le menu
		if (answers.menu == choix[0]) {
			research()
			}
		else if(answers.menu == choix[1]){
			favorite()
		}
		else if(answers.menu == choix[2]){
			history()
		}
		else if(answers.menu == choix[3]){
			db.close();
		}
	});
}

//Fonction de recherche de vidéo et d'ajout de favoris
function research(){
	var search = []
	const j = 0
	//On charge les variables pour afficher la bonne langue
	if (program.français){
		message = 'Veuillez entrer des mots clés : '
		searched = 'Voici les résultats de la recherche : '
		choisir = 'Que voulez-vous faire avec cette vidéo ?'
		watchOrFav = ['Regarder la vidéo', 'Mettre en favoris', 'Quitter']
		placed = 'Vidéo placée dans les favoris !'
		seWaFaDe = ['Recherche : ', 'Visionée : ', 'Favoris : ', 'Supprimée : ']
	}
	else if (program.english){
		message = 'Please enter keywords : '
		searched = 'Results : '
		choisir = 'What are you going to do ?'
		watchOrFav = ['Watch the video', 'Put it in favorite', 'Quit']
		placed = 'Video placed in favorites !'
		seWaFaDe = ['Searched : ', 'Watched : ', 'Favorite : ', 'Deleted : ']
	}
	//Input pour la recherche de vidéo
	inquirer.prompt([
	{
		type:'input',
		message: message,
		name:'search'
	}
	]).then((answers) => {
		//On enregistre l'action dans l'historique
		fs.appendFile('history.txt', seWaFaDe[0] + answers.search +'\n', (err) => {
			if (err) throw err
		})

		//Fonction du module youtube pour rechercher une vidéo avec en paramètre la réponse à l'input
		//Ici on demande seulement 10 résultats en paramètre.
		youtube.search(answers.search, 10, function(error, result){
			if (error){
				console.log(error)
			}
			else{
				//Boucle for pour stocker les réponses dans un tableau de char
				var j = 0
				for (var i = 0; i < 10; i++){
					search[i] = result.items[i].snippet.title
				}

				//Affichage du tableau de char dans le menu pour la séléction utilisateur
				inquirer.prompt([
				{
					type: 'list',
					message: searched,
					name: 'resultats',
					choices: search
				}
				]).then((choice) => {
				//On compare le choix de l'utilsateur avec le résultat de la recherche pour récupérer la postion dans le tableau de la réponse
				while(choice.resultats != search[j])
				{
					j++
				}
				}).then(() => {
					//Menu Regarder - Favoris - Quitter
					inquirer.prompt([
					{
						type:'list',
						message: choisir,
						name:'choisir',
						choices:watchOrFav
					}]).then((response) => {
						//Redirection vers la fonction du choix de l'utilisateur
						if(response.choisir == watchOrFav[0]){
							//Ouvre une page internet dans le navigateur par défaut à l'adresse de la vidéo
							open('https://www.youtube.com/watch?v=' + result.items[j].id.videoId)
							//Ecriture de l'action dans l'historique
							fs.appendFile('history.txt', seWaFaDe[1] + result.items[j].snippet.title +'\n', (err) => {
							if (err) throw err
						})
							menu()
						}
						else if(response.choisir == watchOrFav[1]){
							//On insère dans la base de donnée les informations de la vidéo : Titre, id (lien), description, date de publication
							db.run('INSERT INTO favorite VALUES (?, ?, ?, ?)', result.items[j].snippet.title, result.items[j].id.videoId, result.items[j].snippet.description, result.items[j].snippet.publishedAt)
							//Affichage "Vidéo mise en favoris"
							console.log(placed)
							//Ecriture dans l'historique de l'action réalisée
							fs.appendFile('history.txt', seWaFaDe[2] + result.items[j].snippet.title +'\n', (err) => {
							if (err) throw err
							menu()
							})
						}
						else if (response.choisir == watchOrFav[2]){
							//Si l'utilisateur décide de ne pas regarder la vidéo ou de la mettre en favoris il peut revenir au menu
							menu()
						}
					})
				})
			}	
		})
	});
}

//Fonction d'affichage de la liste de favoris
function favorite(){
//Texte en fonction de la langue
	if (program.français){
		choose = 'Que voulez-vous faire ?'
		favMessage = 'Selectionnez une vidéo'
		favChoices = ['Regarder la vidéo', 'Supprimer la vidéo', 'Quitter']
		succes = 'Vidéo supprimée des favoris'
	}
	else if (program.english){
		choose = 'Whatcha goona do ?'
		favMessage = 'Select a video'
		favChoices = ['Watch the video', 'Delete the video', 'Quit']
		success ='Video deleted from favorites'
	}
//Requête SQL pour afficher toute la table
	return db.all('SELECT * FROM favorite').then((selected) => {
		var text = ''
		var l = 0
		var favs = []
		var count = 0
		var favTitle = []
		var favLink = []

		//On place le résultat de la requête dans un tableau de char pour l'afficher dans le menu
		selected.forEach(function(element){
			favs[l] = element.title + 'https://www.youtube.com/watch?v=' + element.videoId
			favTitle[l] = element.title
			favLink[l] = element.videoId
			l++
		})
			//Menu permettant de sélectionner une vidéo dans la liste des favoris
			inquirer.prompt([
			{
				type:'list',
				message:favMessage,
				name:'choosen',
				choices:favs
			}]).then((choixFav) => {
			
				//On compare le choix de l'utilsateur avec le résultat de la recherche pour récupérer la postion dans le tableau de la réponse
				while(choixFav.choosen != favs[count])
				{
					count++
				}
			}).then(() => {

			//Menu permettant de choisir une action a effectuer avec la vidéo
			inquirer.prompt([
			{
				type:'list',
				message:choose,
				name:'choosed',
				choices:favChoices
			}]).then((favAnswer) => {
				
				//On execute le code correspondant à la réponse de l'utilisateur
				if (favAnswer.choosed == favChoices[0]){
					//Ouvre une page internet dans le navigateur par défaut à l'adresse de la vidéo
					open('https://www.youtube.com/watch?v=' + favLink[count])
					//Ecriture de l'action dans l'historique
					fs.appendFile('history.txt', seWaFaDe[1] + favTitle[count] +'\n', (err) => {
					if (err) throw err
					})
					menu()
				}

				else if(favAnswer.choosed == favChoices[1]){
					//Suppression du favoris
					db.run('DELETE FROM favorite WHERE videoId=(?)',favLink[count], function(err) {
                		if(err){
                	    	console.log(err)
                		}
                		else{
                 	   		console.log(success);
                 			fs.appendFile('history.txt', seWaFaDe[3] + favTitle[count] +'\n', (err) => {
							if (err) throw err
							})

                		}
             
            		});
            		favorite()
				}

				else if(favAnswer.choosed == favChoices[2]){
					menu()
				}
			})
			})
})
}

//Fonction d'affichage de l'historique
function history(){
	//On affiche l'historique (history.txt)
	fs.readFile('history.txt', 'utf8', (err, data) => {
		if(err) throw err
		console.log('\n' + data)
	})
	menu()
}

//On lance le tout premier menu
menu()
   