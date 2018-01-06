import { h, app } from "hyperapp"
/** @jsx h */

const difficulty = {
    MM : { columns : 6}
}

const noteType = {
      placeholder : { label : 'なし'         , value: 0, class: 'placeholder'}
    , single      : { label : '単独ノーツ'    , value: 1, class: 'normal'     }
    , large       : { label : '単独ノーツ(大)', value: 2, class: 'large'      }     
    , right       : { label : '右フリック'    , value: 3, class: 'right'      }
    , left        : { label : '左フリック'    , value: 4, class: 'left'       }
    , up          : { label : '上フリック'    , value: 5, class: 'up'         }
    , linked      : { label : '連結ノーツ'    , value: 6, class: 'normal'     }
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

const updateNotes = (notes, editType, x, y) => notes.map((columns, columnIndex) => columns.map(
    (point, lineIndex) => {
        if (columnIndex === x && lineIndex === y) {
            return {
                type : editType
                , x : columnIndex
                , y : lineIndex
            }
        }
        return point;
    }
));

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
  , setNoteType: ({x, y}) => state => {
        return { notes: updateNotes(state.notes, state.editType, x, y) };
  }
}

const calculateCX = x => basicNoteDiameter * (x * 2 + 1);
const calculateCY = y => basicNoteDiameter * (y + 1);
const calculateSvgWith = () => calculateCX(state.difficulty.columns);
const calculateSvgHeight = () => calculateCY(state.lines);

const Note = ({x, y, type, action, size}) => (
    <circle cx={calculateCX(x)} 
        cy={calculateCY(y)}
        r={size * basicNoteDiameter / 3}
        class={type.class}
        onclick={getHandler(x, y, actions)}/>
);
const getHandler = (x, y, actions) => (e => actions.setNoteType({x : x, y: y}));

const Placeholder = ({x, y, type, actions}) => (
    <circle cx={calculateCX(x)} 
        cy={calculateCY(y)}
        r={basicNoteDiameter / 2}
        class={type.class}
        onclick={getHandler(x, y, actions)}/>
);

const SingleNote = ({x, y, type, actions}) => (
    <Note x={x}
      y={y} 
      type={type}
      actions={actions}
      size={0.8} />
);

const LargeNote = ({x, y, type, actions}) => (
    <Note x={x}
      y={y} 
      type={type}
      actions={actions}
      size={1.3} />
);

const renderNote = (point, actions) => {
    switch(point.type.value) {
        case noteType.single.value:
            return (
            <SingleNote x={point.x}
                y={point.y}
                type={point.type}
                actions={actions} />
            );
        case noteType.large.value:
            return (
            <LargeNote x={point.x}
                y={point.y}
                type={point.type}
                actions={actions} />
            );
        default: 
            return (
            <Placeholder x={point.x}
                y={point.y}
                type={point.type}
                actions={actions} />
            );
    }
};

const view = (state, actions) => (
  <div>
    <svg id="score" class={state.showPlaceholder ? 'showPlaceholder' : ''} width={calculateSvgWith()} height={calculateSvgHeight()} viewBox={'0 0 ' + calculateSvgWith() + ' ' + calculateSvgHeight()}
         xmlns="http://www.w3.org/2000/svg" version="1.1">
         {state.notes.map(columns => columns.map(point => renderNote(point, actions)))}
    </svg>
    <select id="editType" onchange={actions.changeEditType} value={state.editType.value}>
      {noteTypes.map(note => <option value={note.value}>{note.label}</option>)}
    </select>
    <input id="showPlaceholderCheck" type="checkbox" defaultChecked={state.showPlaceholder} onchange={actions.togglePlaceholderVisibility}/>
    <label for="showPlaceholderCheck">ノーツが無い場所にプレースホルダーを表示する</label>
  </div>
);

app(state, actions, view, document.body)