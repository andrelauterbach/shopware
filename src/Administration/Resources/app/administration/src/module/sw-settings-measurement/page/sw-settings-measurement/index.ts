import template from './sw-settings-measurement.html.twig';

/**
 * @sw-package inventory
 * @private
 */
export default {
    template,

    metaInfo() {
        return {
            title: this.$createTitle(),
        };
    },
};
