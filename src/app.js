import { h, app } from "hyperapp"
/** @jsx h */

const difficulty = {
    MM : { columns : 6}
}

const noteType = {
      placeholder   : { label : 'なし'         , value: 0, class: 'placeholder'  }
    , single : { label : '単独ノーツ'    , value: 1, class: 'normal'}
    , large  : { label : '単独ノーツ(大)', value: 2, class: 'large' }
    , right  : { label : '右フリック'    , value: 3, class: 'right' }
    , left   : { label : '左フリック'    , value: 4, class: 'left'  }
    , up     : { label : '上フリック'    , value: 5, class: 'up'    }
    , linked : { label : '連結ノーツ'    , value: 6, class: 'normal'}
}

const noteTypes = Object.keys(noteType).map(key => noteType[key]);

const initNotes = (columns, lines) => {
    let notes = [];
    for (let columnIndex = 0; columnIndex < columns; columnIndex++) {
        notes[columnIndex] = [];
        for (let lineIndex = 0; lineIndex < lines; lineIndex++) {
            notes[columnIndex][lineIndex] = {
                type : noteType.placeholder
                , x : columnIndex
                , y : lineIndex
            }
        }
    }
    return notes;
}

const difficultyState = difficulty.MM;
const initialLines = 8;
const basicNoteDiameter = 32

const state = {
    difficulty: difficultyState
  , lines: initialLines
  , notes: initNotes(difficultyState.columns, initialLines)
  , editType: noteType.single
  , showPlaceholder: true
}

const actions = {
  changeEditType: event => state => {
        const value = parseInt(event.target.value);
        return {editType: noteTypes.filter(note => note.value === value)[0]}
    }
  , togglePlaceholderVisibility: () => state => {
        return { showPlaceholder: !state.showPlaceholder };
  }
}

const calculateCX = x => basicNoteDiameter * (x * 2 + 1);
const calculateCY = y => basicNoteDiameter * (y + 1);
const calculateSvgWith = () => calculateCX(state.difficulty.columns);
const calculateSvgHeight = () => calculateCY(state.lines);

const view = (state, actions) => (
  <div>
    <svg id="score" class={state.showPlaceholder ? 'showPlaceholder' : ''} width={calculateSvgWith()} height={calculateSvgHeight()} viewBox={'0 0 ' + calculateSvgWith() + ' ' + calculateSvgHeight()}
         xmlns="http://www.w3.org/2000/svg" version="1.1">
         {state.notes.map(columns => columns.map(point => <circle cx={calculateCX(point.x)} cy={calculateCY(point.y)} r={basicNoteDiameter / 2} class={point.type.class}/>))}
    </svg>
    <select id="editType" onchange={actions.changeEditType} value={state.editType.value}>
      {noteTypes.map(note => <option value={note.value}>{note.label}</option>)}
    </select>
    <input id="showPlaceholderCheck" type="checkbox" defaultChecked={state.showPlaceholder} onchange={actions.togglePlaceholderVisibility}/>
    <label for="showPlaceholderCheck">ノーツが無い場所にプレースホルダーを表示する</label>
  </div>
)

app(state, actions, view, document.body)