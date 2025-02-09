//
// com.gmail
//
const feedUrl = "https://mail.google.com/mail/feed/atom";

function verify() {
  let authPassword = B64.encode(`${userEmail}:${appPassword}`);
  const authHeader = {"Authorization": `Basic ${authPassword}`};

  return sendRequest(feedUrl, null, null, authHeader)
    .then((xmlResponse, others) => {
      const jsonObject = xmlParse(xmlResponse);
      const feedTitle = jsonObject.feed.title
      const accountEmail = feedTitle.split(" ").pop()
      processVerification({
        displayName: accountEmail
      });
    })
    .catch((requestError) => {
      processError(requestError);
    });
}

function load() {
  let authPassword = B64.encode(`${userEmail}:${appPassword}`);
  const authHeader = {"Authorization": `Basic ${authPassword}`};

  sendRequest(feedUrl, null, null, authHeader)
    .then((xmlResponse) => {
      const jsonObject = xmlParse(xmlResponse);
      let feedIsNotEmpty = jsonObject.feed != null;
      let feedhasPosts = jsonObject.feed.fullcount != "0";

      if (feedIsNotEmpty && feedhasPosts) {
        const feedName = jsonObject.feed.title;
        const linkAttrs = jsonObject.feed.link$attrs;
        const feedUrl = linkAttrs.href;
        const baseUrl = feedUrl.split("/").splice(0,3).join("/");
        const feedAvatar = baseUrl + "/favicon.ico";
        const entries = jsonObject.feed.entry;
        let posts = entries.map(toPosts(feedUrl, feedAvatar));
        processResults(posts);
      }
      else {
        processResults([]);
      }
    })
    .catch((requestError) => {
      processError(requestError);
    });
}

function toPosts(feedUrl, feedAvatar) {
  return (feedEntry) => {
    console.log(feedEntry);
    const entryLinkAttributes = feedEntry.link$attrs;
    const authorName = feedEntry.author.name;
    let entryUrl = entryLinkAttributes.href;
    let date = new Date(feedEntry.issued);
    const content = feedEntry.title;
    // const post = Post.createWithUriDateContent(entryUrl, date, content);
    const item = Item.createWithUriDate(entryUrl, date);
    item.title = feedEntry.title;
    item.body = feedEntry.summary;
    // const creator = Creator.createWithUriName(feedUrl, authorName);
    const creator = Identity.createWithName(authorName);
    creator.uri = feedUrl;
    creator.avatar = feedAvatar;
    item.author = creator;
    return item;
  }
}

var B64 = {
    alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',
    lookup: null,
  encode: function (s) {
    var buffer = B64.toUtf8(s),
    position = -1,
    len = buffer.length,
    nan0, nan1, nan2, enc = [, , , ];
    var result = '';
    while (++position < len) {
      nan0 = buffer[position];
      nan1 = buffer[++position];
      enc[0] = nan0 >> 2;
      enc[1] = ((nan0 & 3) << 4) | (nan1 >> 4);
      if (isNaN(nan1))
        enc[2] = enc[3] = 64;
        else {
          nan2 = buffer[++position];
          enc[2] = ((nan1 & 15) << 2) | (nan2 >> 6);
          enc[3] = (isNaN(nan2)) ? 64 : nan2 & 63;
        }
      result += B64.alphabet[enc[0]] + B64.alphabet[enc[1]] + B64.alphabet[enc[2]] + B64.alphabet[enc[3]];
    }
    return result;
    },
    toUtf8: function (s) {
        var position = -1,
            len = s.length,
            chr, buffer = [];
        if (/^[\x00-\x7f]*$/.test(s)) while (++position < len)
            buffer.push(s.charCodeAt(position));
        else while (++position < len) {
            chr = s.charCodeAt(position);
            if (chr < 128)
                buffer.push(chr);
            else if (chr < 2048)
                buffer.push((chr >> 6) | 192, (chr & 63) | 128);
            else
                buffer.push((chr >> 12) | 224, ((chr >> 6) & 63) | 128, (chr & 63) | 128);
        }
        return buffer;
    }
};
