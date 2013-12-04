"use strict";

jQuery(function () {

    function renderDataPoint(service, dataPointId) {
        jQuery.ajax('http://tosdr.org/points/' + dataPointId + '.json', {success:function (dataPoint) {
            var badge, icon, sign;
            if (dataPoint.tosdr.point == 'good') {
                badge = 'badge-success';
                icon = 'thumbs-up';
                sign = '+';
            } else if (dataPoint.tosdr.point == 'mediocre') {
                badge = 'badge-warning';
                icon = 'thumbs-down';
                sign = '-';
            } else if (dataPoint.tosdr.point == 'alert') {
                badge = 'badge-important';
                icon = 'remove';
                sign = '×';
            } else if (dataPoint.tosdr.point == 'not bad') {
                badge = 'badge-neutral';
                icon = 'arrow-right';
                sign = '→';
            } else {
                badge = '';
                icon = 'question-sign';
                sign = '?';
            }
            document.getElementById('popup-point-' + service + '-' + dataPointId).innerHTML =
                '<div class="' + dataPoint.tosdr.point + '"><h5><span class="badge ' + badge
                    + '" title="' + dataPoint.tosdr.point + '"><i class="icon-' + icon + ' icon-white">' + sign + '</i></span> <a target="_blank" href="' + dataPoint.discussion + '">' + dataPoint.name + '</a></h5><p>'
                    + dataPoint.tosdr.tldr + '</p></div></li>';
            $('#popup-point-' + service + '-' + dataPointId).html(
                '<div class="' + dataPoint.tosdr.point + '"><h5><span class="badge ' + badge
                    + '" title="' + dataPoint.tosdr.point + '"><i class="icon-' + icon + ' icon-white">' + sign + '</i></span> ' + dataPoint.name + ' <a href="' + dataPoint.discussion + '" target="_blank" class="label context">Discussion</a> <!--a href="' + dataPoint.source.terms + '" class="label context" target="_blank">Terms</a--></h5><p>'
                    + dataPoint.tosdr.tldr + '</p></div></li>');
        }});
    }

    var NOT_RATED_TEXT = "We haven't sufficiently reviewed the terms yet. Please contribute to our group: <a target=\"_blank\" href=\"https:\/\/groups.google.com/d/forum/tosdr\">tosdr@googlegroups.com</a>.";
    var RATING_TEXT = {
        0:NOT_RATED_TEXT,
        "false":NOT_RATED_TEXT,
        "A":"The terms of service treat you fairly, respect your rights and follows the best practices.",
        "B":"The terms of services are fair towards the user but they could be improved.",
        "C":"The terms of service are okay but some issues need your consideration.",
        "D":"The terms of service are very uneven or there are some important issues that need your attention.",
        "E":"The terms of service raise very serious concerns."
    };

    function renderPopup(name) {
        var service = JSON.parse(localStorage[name]);
        renderPopupHtml(name, service.name, service.url, service.tosdr.rated, RATING_TEXT[service.tosdr.rated],
            service.points, service.links);
    }

    function isEmpty(map) {
        for (var key in map) {
            if (map.hasOwnProperty(key)) {
                return false;
            }
        }
        return true;
    }

    function renderPopupHtml(name, longName, domain, verdict, ratingText, points, links) {
        var headerHtml = '<div class="modal-header">'
            + '<h3><a href="http://tosdr.org/#' + name + '" target="_blank"><img src="images/tosdr-logo-32.png" alt="" class="pull-left" />'
            + '</a></small>'
            + '<button id="closeButton" data-dismiss="modal" class="close pull-right" type="button">×</button></h3></div>';
        var classHtml = '<div class="tosdr-rating"><label class="label ' + verdict + '">'
            + (verdict ? 'Class ' + verdict : 'No Class Yet') + '</label><p>' + ratingText + '</p></div>';
        var pointsHtml = '';
        for (var i = 0; i < points.length; i++) {
            pointsHtml += '<li id="popup-point-' + name + '-' + points[i] + '" class="point"></li>';
        }

      var votingHtml = '<h2>Vote!</h2>' +
        '<p>Vote to express your like/dislike for these terms of service</p>' +
        '<ul class="thumbnails">' +
        '<li class="like"><a id="vote-up" class="thumbnail">Like<i class="icon-thumbs-up"></i></a><span id="upvote-count" class="badge badge-success">0</span></li>' +
        '<li class="like"><a id="vote-down" class="thumbnail">Dislike<i class="icon-thumbs-down"></i></a><span id="downvote-count" class="badge badge-important">0</span></li>' +
        '</ul>';

      var bodyHtml = '<div class="modal-body">' + classHtml + votingHtml + '<section class="specificissues"> <ul class="tosdr-points">' + pointsHtml + '</ul></section>';

        // Add Links
        if (isEmpty(links)) {
            bodyHtml += '<section><a href="http://tosdr.org/get-involved.html" class="btn" target="_blank"><i class="icon  icon-list-alt"></i> Get Involved</a></section>';
        } else {
            bodyHtml += '<section><h4>Read the Terms</h4><ul class="tosback2">';
            for (var i in links) {
                bodyHtml += '<li><a target="_blank" href="' + links[i].url + '">' + (links[i].name ? links[i].name : i) + '</a></li>';
            }
            bodyHtml += '</ul></section>';
        }

        bodyHtml += '</div>';

        $('#page').html(headerHtml + bodyHtml);
        for (var i = 0; i < points.length; i++) {
            renderDataPoint(name, points[i]);
        }
    }

    var serviceName = window.location.hash.substr(1);
    renderPopup(serviceName);

    $('#closeButton,.close').click(function () {
      chrome.extension.getBackgroundPage().console.log('foo');
      console.log('foo');
      window.close();
    });

  Firebase.enableLogging(true);
  var u = new Firebase('https://tlosdr.firebaseio.com/' + serviceName + '/upvotes');
  var d = new Firebase('https://tlosdr.firebaseio.com/' + serviceName + '/downvotes');

  var vote = function (fb, id, voteDirection) {
    fb.transaction(function(curr) {
      if (isNaN(parseFloat(curr)))
        return 1; // initialize to 1.
      else {

        if (voteDirection == 'up')
          return curr + 1; // increment.
        else
          return curr - 1;
      }
    }, function(error, committed, s) {
      // Once the transaction has completed, update the UI (and watch for updates).
        $(id).html(s.val());
    });
  };

  var voteUI = function(id, clear) {

    if(typeof(clear)==='undefined') clear = false;

    if (!clear) {
      $(id).addClass('liked');
      $(id).find("i").addClass('icon-white');
    }
    else {
      $(id).removeClass('liked');
      $(id).find("i").removeClass('icon-white');
    }
  };

  var toType = function(obj) {
    return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
  };

  var voted = function(voteDirection) {
    if(!voteDirection) {
      var upvoted = JSON.parse(localStorage.getItem('upvoted/' + serviceName));
      var downvoted = JSON.parse(localStorage.getItem('downvoted/' + serviceName));
      return upvoted || downvoted;
    }

    else {
      return JSON.parse(localStorage.getItem(voteDirection + '/' + serviceName));
    }
  };

  var setVotes = function (fb, id) {
    if (voted()) {
      if (voted('upvoted'))
        voteUI('#vote-up');
      else
        voteUI('#vote-down');
    };

    fb.on('value', function(s) {
      if(s.val() === null) {
      } else {
        $(id).html(s.val());
      }
    });

  };

  // Initialize values
  setVotes(u, '#upvote-count');
  setVotes(d, '#downvote-count');

  var handleUpVote = function (fb, countID, voteID, action) {
    if (!voted()) {
      vote(fb, countID, 'up');
      voteUI('#vote-up');
      localStorage.setItem(action + '/' + serviceName, true);
    }
    else {
      // Pressed upvote again, reverse upvote
      if (voted('upvoted')) {
        vote(fb, countID, 'down');
        voteUI(voteID, true);
        localStorage.setItem(action + '/' + serviceName, false);
      }
      // Pressed upvote after a downvote
      else {
        // // Do upvote
        vote(fb, countID, 'up');
        voteUI('#vote-up');
        localStorage.setItem('upvoted/' + serviceName, true);

        // Reverse downvote
        vote(d, '#downvote-count', 'down');
        voteUI('#vote-down', true);
        localStorage.setItem('downvoted/' + serviceName, false);
      }
    }
  };

  var handleDownVote = function (fb, countID, voteID, action) {
    if (!voted()) {
      vote(fb, countID, 'up');
      voteUI('#vote-down');
      localStorage.setItem(action + '/' + serviceName, true);
    }
    else {
      // Pressed downvote again, reverse downvote
      if (voted('downvoted')) {
        vote(fb, countID, 'down');
        voteUI(voteID, true);
        localStorage.setItem(action + '/' + serviceName, false);
      }
      // Pressed downvote after a upvote
      else {
        // // Do downvote
        vote(fb, countID, 'up');
        voteUI('#vote-down');
        localStorage.setItem('downvoted/' + serviceName, true);

        // Reverse upvote
        vote(d, '#upvote-count', 'down');
        voteUI('#vote-up', true);
        localStorage.setItem('upvoted/' + serviceName, false);
      }
    }
  };

  $('#vote-up').click(function () {
    handleUpVote(u, '#upvote-count', '#vote-up', 'upvoted');
  });

  $('#vote-down').click(function () {
    handleDownVote(d, '#downvote-count', '#vote-down', 'downvoted');
  });

});
