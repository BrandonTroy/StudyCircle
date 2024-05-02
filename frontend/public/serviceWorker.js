function log(...data) {
  console.log("SWv1.0", ...data);
}

log("SW Script executing - adding event listeners");


const STATIC_CACHE_NAME = 'studycircle-static-v0';

self.addEventListener('install', event => {
  log('install', event);
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then(cache => {
      return cache.addAll([
        // '/offline',
        //CSS
        '/src/style/App.css',
        '/src/style/index.css',
        '/src/style/theme.js',
        '/src/style/User.css',
        '/src/utils/formatTime.js',
        // 'index.css',
        // 'theme.js',
        // 'User.css',

        //JS
        // 'formatTime.js',

        // 'accountApi.js',
        // 'circlesApi.js',
        // 'classesApi.js',
        // 'eventsApi.js',
        // 'friendsApi.js',
        // 'notificationsApi.js',


        
      ]);
    })
  );
});

self.addEventListener('activate', event => {
  log('activate', event);
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName.startsWith('studycircle-') && cacheName != STATIC_CACHE_NAME;
        }).map(cacheName => {
          return caches.delete(cacheName);
        })
      );
    })
  );
});


self.addEventListener('fetch', event => {
  var requestUrl = new URL(event.request.url);
  //Treat API calls (to our API) differently
  if(requestUrl.origin === location.origin && requestUrl.pathname.startsWith('/api')) {
    //If we are here, we are intercepting a call to our API
    if(event.request.method === "GET") {
      //Only intercept (and cache) GET API requests
      event.respondWith(
        // cacheFirst(event.request)
        networkFirst(event.request)
      );
    }
  }
  else {
    //If we are here, this was not a call to our API
    event.respondWith(
      // cacheFirst(event.request)
      networkFirst(event.request)
    );
  }

});


// function cacheFirst(request) {
//   return caches.match(request)
//   .then(response => {
//     //Return a response if we have one cached. Otherwise, get from the network
//     return response || fetchAndCache(request);
//   })
//   .catch(error => {
//     // return caches.match('/offline');
//   })
// }

function networkFirst(request) {
  return fetchAndCache(request)
  .catch(error => {
    //If we get an error, try to return from cache
    return caches.match(request);
  });
}

function fetchAndCache(request) {
  return fetch(request).then(response => {
    var requestUrl = new URL(request.url);
    //Cache successful GET requests that are not browser extensions
    if(response.ok && request.method === "GET" && !requestUrl.protocol.startsWith('chrome-extension')
      // && !requestUrl.pathname.startsWith('/node_modules')
    ) {
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        cache.put(request, response);
      });
    }
    return response.clone();
  });
}



self.addEventListener('message', event => {
  log('message', event.data);
  if(event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});


/********************\
* PUSH NOTIFICATIONS *
\********************/

self.addEventListener("push", event => {
  log("push", event);

  const message = event.data.json();
  return self.registration.showNotification(message.title, {
    body: message.body
  });
  // event.waitUntil(
  //   //Get all open windows (matchAll defaults to browser tab windows)
  //   self.clients.matchAll().then(clients => {
  //     //Only show notifications if we don't have the page open
  //     if(clients.length === 0) {
  //       return self.registration.showNotification(message.title, {
  //         body: message.body
  //       })
  //     }
  //   })
  // );
});

self.addEventListener("notificationclick", event => {
  log("notificationclick", event);
  //Close the notification when clicked and open the browser
  event.notification.close();
  event.waitUntil(
    self.clients.openWindow(self.location.origin),
  );
});