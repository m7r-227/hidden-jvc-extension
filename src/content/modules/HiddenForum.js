import hiddenJVC from '../HiddenJVC.js';

import forumTemplate from '../views/hidden/forum/forum.handlebars';
import loadingTemplate from '../views/hidden/forum/loading.handlebars';

const { getState } = hiddenJVC.storage;
const { Runtime } = hiddenJVC.constants;
const { JVC, Hidden } = hiddenJVC.constants.Static;
const { network, createPagination, initForm } = hiddenJVC.helpers;

class HiddenForum {
    constructor() {
        this.pages = JVC.Pages.HIDDEN_FORUM;
    }

    async init(state) {
        document.querySelector('#forum-main-col').outerHTML = loadingTemplate();

        const { topics, count } = await network.getRequest(Hidden.API_HIDDEN_TOPICS, {
            forumId: Runtime.forumId,
            page: state.hidden.list.page,
        });

        this.render(topics, count, state.hidden.list.page, state.user);
        this.initDomEvents();
    }

    render(topics, count, page, user) {
        const lastPage = Math.ceil(count / 20);
        const pagination = createPagination(page, lastPage);

        for (const topic of topics) {
            topic.Url = `https://www.jeuxvideo.com/forums/0-${Runtime.forumId}-0-1-0-1-0-0.htm?hidden=1&view=topic&topicId=${topic.Topic.Id}&topicPage=1`;
        }

        const isModerator = user.isAdmin || user.moderators.filter((m) => m.ForumId === Runtime.forumId).length === 1;

        const data = {
            user,
            isModerator,
            topics,
            page,
            lastPage,
            pagination,
            forumName: Runtime.forumName
        };

        const html = forumTemplate(data);
        document.querySelector('#forum-main-col').outerHTML = html;
    }

    initDomEvents() {
        document.querySelectorAll('button.btn-actualiser-forum').forEach((btn) => {
            btn.addEventListener('click', () => location.reload());
        });

        const form = document.querySelector('#hidden-form');
        initForm(form);

        form.querySelector('#hidden-submit').addEventListener('click', async () => {
            try {
                const title = document.querySelector('input#title').value;
                const content = document.querySelector('textarea#message_topic').value;

                const data = {
                    title,
                    content,
                    forumId: Runtime.forumId
                };

                const state = await getState();
                if (!state.user.jwt) {
                    data.username = state.user.name || 'Anonymous';
                }

                const { topicId } = await network.postRequest(Hidden.API_HIDDEN_TOPICS, data, state.user.jwt);
                if (topicId) {
                    const url = `https://www.jeuxvideo.com/forums/0-${Runtime.forumId}-0-1-0-1-0-0.htm?hidden=1&view=topic&topicPage=1&topicId=${topicId}`;
                    location.replace(url);
                } else {
                    throw new Error('fail to create topic');
                }
            } catch (err) {
                console.error(err);
            }
        });

        const moderationActionSubmit = document.querySelector('#moderation-action-submit');
        if (moderationActionSubmit !== null) {

            moderationActionSubmit.addEventListener('click', async () => {
                const topicInputs = document.querySelectorAll('.topic-select input');
                const ids = [];
                for (const input of topicInputs) {
                    if (input.checked) {
                        ids.push(parseInt(input.value));
                    }
                }
                const action = document.querySelector('#moderation-action-select').value;

                const state = await getState();
                const { success } = await network.postRequest(Hidden.API_HIDDEN_TOPICS_MODERATION, { action, ids }, state.user.jwt);
                if (success) {
                    location.reload();
                }
            });
        }
    }
}

const hiddenList = new HiddenForum();
hiddenJVC.registerModule(hiddenList);
