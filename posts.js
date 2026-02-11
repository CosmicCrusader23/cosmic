/*
  posts.js
  Loads content.json and renders the posts list
*/

(function () {
  'use strict';

  fetch('content.json')
    .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
    .then(renderPosts)
    .catch(function () { 
      document.getElementById('post-list').innerHTML = '<li class="post-empty">No posts yet. Check back soon!</li>';
    });

  function renderPosts(c) {
    if (!c.writing || !c.writing.length) {
      document.getElementById('post-list').innerHTML = '<li class="post-empty">No posts yet. Check back soon!</li>';
      return;
    }

    var ul = document.getElementById('post-list');
    if (!ul) return;

    // Filter out placeholder entries (no URL)
    var posts = c.writing.filter(function(p) { return p.url; });

    if (!posts.length) {
      ul.innerHTML = '<li class="post-empty">No posts yet. Check back soon!</li>';
      return;
    }

    ul.innerHTML = posts.map(function (p) {
      var date = p.date || '';
      var desc = p.description || '';
      
      return '<li class="post-item">'
        + '<a href="' + esc(p.url) + '" class="post-link">'
        + '<span class="post-title">' + esc(p.title) + '</span>'
        + (date ? '<span class="post-date">' + esc(date) + '</span>' : '')
        + '</a>'
        + (desc ? '<p class="post-desc">' + esc(desc) + '</p>' : '')
        + '</li>';
    }).join('');
  }

  function esc(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
})();
