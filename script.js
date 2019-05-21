const clearContent = () => {
    //blueBarDOMInspector.remove()
    leftCol.remove()
    rightCol.remove()
    //pagelet_sidebar.remove()
    pagelet_dock.remove()
    //headerArea.remove()
    //pagelet_group_composer.remove()
    pagelet_group_mall.style['margin-right'] = '-700px'
    pagelet_group_mall.style['padding-left'] = '500px'
}
const d2 = s => {
    return `0${s}`.slice(-2)
}
const log = (type, data) => {
    let today = new Date()
    let date = `${today.getFullYear()}-${(today.getMonth()+1)}-${today.getDate()}`
    let time = `${d2(today.getHours())}:${d2(today.getMinutes())}:${d2(today.getSeconds())}:${d2(today.getMilliseconds())}`
    console.log(`${date} ${time} | [${type.toUpperCase()}] ${data}`)
}

const processPost = postEl => {
        id = postEl.parentElement.parentElement.id
        author = postEl.querySelector('.clearfix').querySelectorAll('a')[1].innerHTML
        authorUrl = postEl.querySelector('.clearfix').querySelectorAll('a')[1].href.split('?')[0]
        time = postEl.querySelector('.timestampContent').innerHTML
        content = postEl.querySelector('.userContent').innerHTML.replace(/<\/?[^>]+(>|$)/g, '').replace('See More','')
        likes = postEl.querySelector('[data-testid="UFI2ReactionsCount/sentenceWithSocialContext"]') ? postEl.querySelector('[data-testid="UFI2ReactionsCount/sentenceWithSocialContext"]').children[0].innerHTML : 0
        return  {id, author, authorUrl, time, content, likes}
}
const isLoading = (commentsEl) => {
    return new Promise((resolve, reject) => {
        setTimeout(()=>{
            let loadMore = commentsEl.querySelector('[data-testid="UFI2CommentsPagerRenderer/pager_depth_0"]')
            if(loadMore) {
                loadMore.click()
                resolve(true)
            } else {
                resolve(false)
            }
        },20)
    })
}
const loadAllComments = async (commentsEl) => {
    let loading = true
    while(loading) {
        loading = (await isLoading(commentsEl))
    }
}
let postsStrings = []
let commentsStrings = []
const processComments = async postEl => {
    let commentsEl = postEl.querySelector('[data-testid="UFI2CommentsList/root_depth_0"]')
    await loadAllComments(commentsEl)
    let commentsUl = commentsEl.querySelector('ul')
    let comments = []
    if(commentsUl) 
        [...commentsUl.children].forEach(commentLi => {
            try {
                let comment = {}
                let commentBody = commentLi.querySelector('[data-testid="UFI2Comment/body"]')
                comment.author = commentBody.children[0].children[0].innerHTML
                comment.authorUrl = commentBody.children[0].children[0].href
                comment.content = commentBody.children[0].children[1].children[0].children[0].innerHTML.replace(/<\/?[^>]+(>|$)/g, '')
                comments.push(comment)
            } catch(err) {

            }
            
        })
    return comments
}
//UFI2Comment/body
//UFI2CommentsPagerRenderer/pager_depth_0
const processPosts = async () => {
    let postsElements =  [...document.body.getElementsByClassName('userContentWrapper')]
    for (postEl of postsElements) {
        let post = processPost(postEl)
        let comments = await processComments(postEl)
        postsStrings.push(`${post.id};${post.author};${post.authorUrl};${post.time};${post.content};${post.likes}`)
        comments.forEach(comment => {
            commentsStrings.push(`${post.id};${comment.author};${comment.authorUrl};${comment.content}`)
        })
        postEl.parentElement.remove()
        checkLength()
    }
}
const checkLength = () => {
    if(postsStrings.length > 1000) {
        writeToFile('posts',postsStrings.join('\n'))
        postsStrings.length = 0
    }
    if(commentsStrings.length > 1000) {
        writeToFile('comments',commentsStrings.join('\n'))
        commentsStrings.length = 0
    }
}
const isNewFeed = () => {
    return new Promise((resolve, reject) => {
        setTimeout(()=>{
            window.scrollBy(0, 200)
            setTimeout(() => {
                window.scrollBy(0, -200)
            },100)
            setTimeout(() => {
                let posts = [...document.body.getElementsByClassName('userContentWrapper')]
                if (posts.length > 0) {
                    resolve(true)
                } else {
                    resolve(false)
                }
            },500) 
        }, 1000)
    })
}
const waitForNewFeed = async () => {
    let waiting = true
    let counter = 1
    while (waiting) {
        log('LOADING FEED', ``)
        waiting = !(await isNewFeed())
        counter ++
    }
}
const processPage = async () => {
    clearContent()
    for(let i=0; i<20; i++) {
        await processPosts()
        await waitForNewFeed()
    }
}
processPage()


//TODO
const writeToFile = (type, data) => {
    let a = document.createElement('a')
    a.href = "data:application/octet-stream,"+encodeURIComponent(data)
    a.download = `${type}.csv`
    a.click()
    a.remove()
}
