/* VARIABLES GLOBAL */
const monthDir = {
    January: '01',
    February: '02',
    March: '03',
    April: '04',
    May: '05',
    June: '06',
    July: '07',
    August: '08',
    September: '09',
    October: '10',
    November: '11',
    December: '12'
}


/* HELPERD */
const convertTime = timeString => {
    if(timeString.includes('Yesterday') || timeString.includes('hr') || timeString.includes('min') || timeString.includes('now')){
        let today = new Date()
        return timeString.includes('Yesterday') ?  `${today.getFullYear()}-${d2((today.getMonth()+1))}-${d2(today.getDate()-1)}` : `${today.getFullYear()}-${d2(today.getMonth()+1)}-${d2(today.getDate())}`
    } else {
        let today = new Date()
        if(monthDir[timeString.trim().split(' ')[0]]){
            return `${today.getFullYear()}-${monthDir[timeString.split(' ')[0]]}-${d2(timeString.split(' ')[1].replace(',',''))}`
        } else {
            return timeString
        }
    }
}
const d2 = s => {
    return `0${s}`.slice(-2)
}



/* PROCESS */
const processPost = postEl => {
        return {
        id: postEl.parentElement.parentElement.id.replace('mall_post_','').replace(':6:0',''),
        author: postEl.querySelector('.clearfix').querySelectorAll('a')[1].innerHTML,
        authorUrl: postEl.querySelector('.clearfix').querySelectorAll('a')[1].href.split('?')[0],
        time: convertTime(postEl.querySelector('.timestampContent').innerHTML),
        content: postEl.querySelector('.userContent').innerHTML.replace(/<\/?[^>]+(>|$)/g, '').replace('See More',''),
        likes: postEl.querySelector('[data-testid="UFI2ReactionsCount/sentenceWithSocialContext"]') ? postEl.querySelector('[data-testid="UFI2ReactionsCount/sentenceWithSocialContext"]').children[0].innerHTML : 0
        }
}
const processComments = async postEl => {
    commentsEl = postEl.querySelector('[data-testid="UFI2CommentsList/root_depth_0"]')
    await waitForComments(commentsEl)
    commentsUl = commentsEl.querySelector('ul')
    comments = []
    commentsUl.querySelectorAll('li').forEach(commentLi => {
        try {
            let commentBody = commentLi.querySelector('[data-testid="UFI2Comment/body"]')
            comments.push({
                author: commentBody.children[0].children[0].innerHTML, 
                authorUrl: commentBody.children[0].children[0].href, 
                content: commentBody.children[0].children[1].children[0].children[0].innerHTML.replace(/<\/?[^>]+(>|$)/g, '') 
            })
        } catch(err) {}
    })
    return comments
}




/* WAITERS */
const waitForComments = async (commentsEl) => {
    let loading = true
    while(loading) {
        loading = (await isComments(commentsEl))
    }
}
const waitForFeed = async () => {
    let waiting = true
    while (waiting) {
        waiting = !(await isNewFeed())
    }
}
const isComments = (commentsEl) => {
    return new Promise((resolve, reject) => {
        let loadMore = commentsEl.querySelector('[data-testid="UFI2CommentsPagerRenderer/pager_depth_0"]')
        if(loadMore) {
            loadMore.click()
        }
        setTimeout(()=>{
            loadMore = commentsEl.querySelector('[data-testid="UFI2CommentsPagerRenderer/pager_depth_0"]')
            if(loadMore) {
                loadMore.click()
                resolve(true)
            } else {
                resolve(false)
            }
        },500)
    })
}
const isNewFeed = () => {
    return new Promise((resolve, reject) => {
        setTimeout(()=>{
            window.scrollBy(0, 200)
            setTimeout(() => {
                window.scrollBy(0, -200)
            },100)
            setTimeout(() => {
                posts = [...document.body.getElementsByClassName('userContentWrapper')]
                if (posts.length > 0) {
                    resolve(true)
                } else {
                    resolve(false)
                }
            },500) 
        }, 700)
    })
}




/* MAIN PROCESS */
const processPosts = async () => {
    let postsElements =  [...document.body.getElementsByClassName('userContentWrapper')]
    let postsStrings = []
    let commentsStrings = []
    for (postEl of postsElements) {
        post = processPost(postEl)
        comments = await processComments(postEl)
        postsStrings.push(`${post.id};${post.author};${post.authorUrl};${post.time};${post.content};${post.likes};${comments.length}`)
        comments.forEach(comment => {
            commentsStrings.push(`${post.id};${comment.author};${comment.authorUrl};${comment.content}`)
        })
        postEl.parentElement.remove()
        postEl = null
        
    }
    checkLength(postsStrings, commentsStrings)
}


const processPage = async () => {
    window.clear = clear
    for(let i=0; i<100000; i++) {
        clear()
        await processPosts()
        await waitForFeed()
    }
}
processPage()



/* WRITERS AND STUFF */
const checkLength = (postsStrings, commentsStrings) => {
    if(postsStrings.length > 100) {
        writeToFile('posts',postsStrings.join('\n'))
    }
    if(commentsStrings.length > 300) {
        writeToFile('comments',commentsStrings.join('\n'))
    }
}
const writeToFile = (type, data) => {
    a = document.createElement('a')
    a.href = "data:application/octet-stream,"+encodeURIComponent(data)
    a.download = `${type}.csv`
    a.click()
    a.remove()
}
