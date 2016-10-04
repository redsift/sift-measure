/**
 * Sift Measure. Email client controller entry point.
 */
import { EmailClientController, registerEmailClientController } from '@redsift/sift-sdk-web';

export default class MyEmailClientController extends EmailClientController {
  constructor() {
    super();
  }

  // TODO: link to docs
  loadThreadListView (listInfo) {
    console.log('sift-measure: loadThreadListView: ', listInfo);
    if (listInfo) {
      return {
        template: '001_list_common_txt',
        value: {
          color: '#ffffff',
          backgroundColor: '#e11010',
          subtitle: listInfo.words + ' words, ' + (listInfo.messages || 0) + ' messages'
        }
      };
    }
  };
}

// Do not remove. The Sift is responsible for registering its views and controllers
registerEmailClientController(new MyEmailClientController());
