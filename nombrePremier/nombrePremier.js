var ScribeSpeak;
var token;
var TIME_ELAPSED;
var FULL_RECO;
var PARTIAL_RECO;
var TIMEOUT_SEC = 10000;

exports.init = function () {
    info('[ NombrePremier ] is initializing ...');
}

exports.action = function(data, callback){
	
	ScribeSpeak = SARAH.ScribeSpeak;

	FULL_RECO = SARAH.context.scribe.FULL_RECO;
	PARTIAL_RECO = SARAH.context.scribe.PARTIAL_RECO;
	TIME_ELAPSED = SARAH.context.scribe.TIME_ELAPSED;

	SARAH.context.scribe.activePlugin('NombrePremier');

	var util = require('util');
	console.log("NombrePremier call log: " + util.inspect(data, { showHidden: true, depth: null }));

	SARAH.context.scribe.hook = function(event) {
		checkScribe(event, data.action, callback); 
	};
	
	token = setTimeout(function(){
		SARAH.context.scribe.hook("TIME_ELAPSED");
	}, TIMEOUT_SEC);

}

function checkScribe(event, action, callback) {

	if (event == FULL_RECO) {
		clearTimeout(token);
		SARAH.context.scribe.hook = undefined;
		// aurait-on trouvé ?
		decodeScribe(SARAH.context.scribe.lastReco, callback);

	} else if(event == TIME_ELAPSED) {
		// timeout !
		SARAH.context.scribe.hook = undefined;
		// aurait-on compris autre chose ?
		if (SARAH.context.scribe.lastPartialConfidence >= 0.7 && SARAH.context.scribe.compteurPartial > SARAH.context.scribe.compteur) {
			decodeScribe(SARAH.context.scribe.lastPartial, callback);
		} else {
			SARAH.context.scribe.activePlugin('Aucun (NombrePremier)');
			ScribeSpeak("Désolé je n'ai pas compris. Merci de réessayer.", true);
			return callback();
		}
		
	} else {
		// pas traité
	}
}

function decodeScribe(search, callback) {

	console.log ("Search: " + search);
	var rgxp = /(dire si|dit si|moi si|que|nombre) (.+) (et|est|d'un|nombre)/i;

	var match = search.match(rgxp);
	if (!match || match.length <= 1){
		SARAH.context.scribe.activePlugin('Aucun (GoogleInfo)');
		ScribeSpeak("Désolé je n'ai pas compris.", true);
		return callback();
	}

	nombre = match[2];
	return isPrimeNumber(nombre, callback);
}

function isPrimeNumber(nbr, callback){
	var nbr = parseFloat(nbr);

	if(Number.isNaN(nbr) == true) {
		ScribeSpeak("Désolé, j'ai compris autre chose qu'un chiffre");
		callback();
		return;
	}

	var fs = require("fs");
	var path = require('path');
 	var filePath = __dirname + "/NombresPremiers.json";
	var file_content;

	file_content = fs.readFileSync(filePath, 'utf8');
	file_content = JSON.parse(file_content);

	// On regarde si on a pas déjà cherché ce nombre
	if(typeof file_content[nbr] != 'undefined' && file_content[nbr] != "") {
		console.log('[ NombrePremier ] Vérifié via la sauvegarde');
		var prime = file_content[nbr];
		if(prime == true) {
	    	ScribeSpeak("oui le nombre " + nbr + " est premier");
	    } else {
	    	ScribeSpeak("Non, " + nbr + " n'est pas un nombre premier");
	    }
		callback();
		return;

	} else {
		var prime = true;

	    if(nbr < 2) {
	        prime = false;
	    }
	    if(nbr == 2) {
	        prime = true;
	    }
	    if(nbr%2 == 0){
	        prime = false;
	    }
	 
	    var racine = Math.sqrt(nbr);
	 
	    if(racine == parseInt(racine)) {
	        prime = false;
	    }
	    for(var i = 3; i < racine;i += 2){
	        if(nbr%i == 0){
	            prime = false;
	        }
	    }

	    if(prime == true) {
	    	ScribeSpeak("oui le nombre " + nbr + " est premier");
	    } else {
	    	ScribeSpeak("Non, " + nbr + " n'est pas un nombre premier");
	    }
	    console.log("[ NombrePremier ] Vérifié via l'algorithme");
	    // On stock le résultat pour une éventuel prochaine fois
	    file_content[nbr] = prime;
    	chaine = JSON.stringify(file_content, null, '\t');
		fs.writeFile(filePath, chaine, function (err) {
			console.log("[ NombrePremier ] Informations enregistrés");
		});

	    callback();
	    return;
	}
}