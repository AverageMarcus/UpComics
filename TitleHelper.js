var getTitle = function getTitle(fullTitle){
	return splitTitle(fullTitle).title;
};

var getIssue = function getIssue(fullTitle){
	return splitTitle(fullTitle).issue;
};

var splitTitle = function splitTitle(fullTitle){
	var titleParts = {title:'',issue:''};
	if(fullTitle.indexOf('#') >= 0){
		titleParts.title = fullTitle.substring(0,fullTitle.indexOf('#')).trim();
		titleParts.issue = fullTitle.substring(fullTitle.indexOf('#')+1).trim();
	}else if(fullTitle.indexOf('Vol.') >= 0){
		titleParts.title = fullTitle.substring(0,fullTitle.indexOf('Vol.')).trim();
		titleParts.issue = fullTitle.substring(fullTitle.indexOf('Vol.')+4).trim();
	}else if(fullTitle.indexOf('Vol') >= 0){
		titleParts.title = fullTitle.substring(0,fullTitle.indexOf('Vol')).trim();
		titleParts.issue = fullTitle.substring(fullTitle.indexOf('Vol')+3).trim();
	}else if(fullTitle.indexOf('Book ') >= 0){
		titleParts.title = fullTitle.substring(0,fullTitle.indexOf('Book ')).trim();
		titleParts.issue = fullTitle.substring(fullTitle.indexOf('Book ')+5).trim();
	}else{
		console.warn("Unable to find the issue from the given title '"+fullTitle+"', assuming #1");
		titleParts.title = fullTitle.trim();
		titleParts.issue = 1;
	}

	return titleParts;
};

exports.getTitle = getTitle;
exports.getIssue = getIssue;