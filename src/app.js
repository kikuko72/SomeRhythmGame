import { h, app } from "hyperapp"
/** @jsx h */

const difficulty = {
    MM : { columns : 6}
}

const noteType = {
      none   : { label : 'なし'         , value: 0}
    , single : { label : '単独ノーツ'    , value: 1}
    , large  : { label : '単独ノーツ(大)', value: 2}
    , right  : { label : '右フリック'    , value: 3}
    , left   : { label : '左フリック'    , value: 4}
    , up     : { label : '上フリック'    , value: 5}
    , linked : { label : '連結ノーツ'    , value: 6}
}

const noteTypes = Object.keys(noteType).map(key => noteType[key]);

const initNotes = (columns, lines) => {
    let notes = [];
    for (let columnIndex = 0; columnIndex < columns; columnIndex++) {
        notes[columnIndex] = [];
        for (let lineIndex = 0; lineIndex < lines; lineIndex++) {
            notes[columnIndex][lineIndex] = {
                type : noteType.none
                , x : columnIndex
                , y : lineIndex
            }
        }
    }
    return notes;
}

const state = {
  notes: initNotes(difficulty.MM.columns)
  , editType: noteType.single
}

const actions = {
  changeEditType: event => state => {
        const value = parseInt(event.target.value);
        return {editType: noteTypes.filter(note => note.value === value)[0]}
    }
}

const view = (state, actions) => (
  <div>
    <svg id="score" width="208px" height="288px" viewBox="0 0 208 288"
         xmlns="http://www.w3.org/2000/svg" version="1.1">
    </svg>
    <select id="editType" onchange={actions.changeEditType} value={state.editType.value}>
      {noteTypes.map(note => <option value={note.value}>{note.label}</option>)}
    </select>
    <p>{state.editType.label}</p>
  </div>
)

app(state, actions, view, document.body)