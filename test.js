const state = {
    draw: {
        activeEvent: 'sunday',
        sunday: { enabled: true }
    }
};
const isSundayEnabled = !!(state.draw && state.draw.sunday && state.draw.sunday.enabled);
let activeEventName = (state.draw && state.draw.activeEvent) || 'thursday';
if (activeEventName === 'sunday' && !isSundayEnabled) {
    activeEventName = 'thursday';
}
const isSunday = activeEventName === 'sunday' && isSundayEnabled;
console.log({isSundayEnabled, activeEventName, isSunday});
