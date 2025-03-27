import template from './sw-settings-measurement-base.html.twig';

/**
 * @sw-package inventory
 * @private
 */
export default {
    template,

    data() {
        return {
            unitSystem: 'metric',
            dimensionUnit: 'meter',
            weightUnit: 'kilogram',
        };
    },

    computed: {
        unitSystemOptions() {
            return [
                { label: 'Metric', value: 'metric' },
                { label: 'Imperial', value: 'imperial' },
            ];
        },

        dimensionUnitOptions() {
            return [
                { label: 'Meter', value: 'meter' },
                { label: 'Centimeter', value: 'centimeter' },
            ];
        },

        weightUnitOptions() {
            return [
                { label: 'Kilogram', value: 'kilogram' },
                { label: 'Gram', value: 'gram' },
            ];
        },
    },
};
