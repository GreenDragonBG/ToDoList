import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Header from './components/Header';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult
} from "@hello-pangea/dnd";

const AppBackground = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #23272f 0%, #181a20 100%);
  display: flex;
  flex-direction: column;
`;

const CenteredContainer = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 110px;
`;

const Board = styled.div`
  display: flex;
  gap: 2rem;
  width: 100%;
  max-width: 1100px;
  flex-direction: column;
`;

const TopBar = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
`;

const AddForm = styled.form`
  width: 100%;
  max-width: 500px;
  display: flex;
  gap: 1rem;
`;

const TodoInput = styled.input`
  flex: 1;
  padding: 0.85rem 1.1rem;
  border: 1.5px solid #444a5a;
  border-radius: 8px;
  font-size: 1.08rem;
  background: #23242b;
  color: #e6e6e6;
  transition: border 0.2s, background 0.2s;
  &:focus {
    outline: none;
    border-color: #4e7fff;
    background: #23272f;
  }
`;

const AddButton = styled.button`
  background: #4e7fff;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 0 1.5rem;
  font-size: 1.08rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.18s;
  &:hover {
    background: #3456b0;
  }
`;

const ColumnsRow = styled.div`
  display: flex;
  gap: 2rem;
  width: 100%;
  align-items: flex-start;
`;

const Column = styled.div<{ color: string }>`
  background: #23242b;
  border-radius: 16px;
  border: 2.5px solid ${props => props.color};
  box-shadow: 0 4px 24px rgba(0,0,0,0.25);
  flex: 1 1 0;
  min-width: 280px;
  max-width: 350px;
  padding: 2rem 1.2rem 1.2rem 1.2rem;
  display: flex;
  flex-direction: column;
  min-height: 120px;
  height: auto;
  transition: min-height 0.2s, height 0.2s;
`;

const ColumnTitle = styled.h3<{ color: string }>`
  font-size: 1.25rem;
  font-weight: 700;
  color: ${props => props.color};
  margin-bottom: 1.2rem;
  text-align: center;
  letter-spacing: 0.5px;
`;

const TodoList = styled.div`
  flex: 1;
  overflow-y: auto;
  min-height: 40px;
  margin-top: 1.2rem;
`;

const TodoItem = styled.div<{ status: string }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: ${({ status }) =>
    status === 'todo' ? '#232a36' : status === 'doing' ? '#2a2736' : '#1e2b28'};
  border-radius: 8px;
  margin-bottom: 0.75rem;
  padding: 0.85rem 1rem;
  box-shadow: 0 1px 4px rgba(30, 40, 60, 0.18);
  opacity: ${({ status }) => (status === 'done' ? 0.7 : 1)};
  text-decoration: none;
  border-left: 5px solid ${({ status }) =>
    status === 'todo' ? '#4e7fff' : status === 'doing' ? '#f7b801' : '#1ecb8b'};
  transition: background 0.2s, border-color 0.2s, box-shadow 0.2s;
  &:hover {
    background: #23272f;
  }
`;

const TodoText = styled.span`
  flex: 1;
  cursor: pointer;
  font-size: 1.08rem;
  color: #e6e6e6;
`;

const TodoActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  background: #232a36;
  color: #e06c75;
  border: none;
  border-radius: 6px;
  padding: 0.35rem 0.9rem;
  cursor: pointer;
  font-size: 1.15rem;
  font-weight: 700;
  transition: background 0.18s, color 0.18s;
  &:hover {
    background: #3a3f4b;
    color: #fff;
  }
`;

const statusColors = {
  todo: '#4e7fff',
  doing: '#f7b801',
  done: '#1ecb8b',
};

interface Todo {
  id: string;
  text: string;
  status: 'todo' | 'doing' | 'done';
}

const getColumnTasks = (tasks: Todo[], status: 'todo' | 'doing' | 'done') =>
  tasks.filter(t => t.status === status);

const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('todos');
    if (stored) setTodos(JSON.parse(stored));
  }, []);

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  const handleAddTask = (text: string) => {
    if (!text.trim()) return;
    setTodos(prev => [
      ...prev,
      { id: Date.now().toString(), text: text.trim(), status: 'todo' }
    ]);
  };

  const deleteTodo = (id: string) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
  };

  const moveTodo = (id: string, newStatus: 'todo' | 'doing' | 'done') => {
    setTodos(prev => prev.map(todo => todo.id === id ? { ...todo, status: newStatus } : todo));
  };

  const startEdit = (id: string, text: string) => {
    setEditId(id);
    setEditText(text);
  };

  const saveEdit = (id: string) => {
    setTodos(prev => prev.map(todo => todo.id === id ? { ...todo, text: editText } : todo));
    setEditId(null);
    setEditText('');
  };

  const columns = [
    { key: 'todo', label: 'To Be Done', color: statusColors.todo },
    { key: 'doing', label: 'Is Being Done', color: statusColors.doing },
    { key: 'done', label: 'Is Done', color: statusColors.done },
  ];

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    const newStatus = destination.droppableId as 'todo' | 'doing' | 'done';
    setTodos(prev =>
      prev.map(todo =>
        todo.id === draggableId ? { ...todo, status: newStatus } : todo
      )
    );
  };

  return (
    <AppBackground>
      <Header onAddTask={handleAddTask} />
      <CenteredContainer>
        <Board>
          <DragDropContext onDragEnd={onDragEnd}>
            <ColumnsRow>
              {columns.map((col) => (
                <Droppable droppableId={col.key} key={col.key}>
                  {(provided) => (
                    <Column
                      color={col.color}
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                    >
                      <ColumnTitle color={col.color}>{col.label}</ColumnTitle>
                      <TodoList>
                        {getColumnTasks(todos, col.key as Todo['status']).map((todo, idx) => (
                          <Draggable draggableId={todo.id} index={idx} key={todo.id}>
                            {(dragProvided, dragSnapshot) => (
                              <TodoItem
                                status={todo.status}
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                {...dragProvided.dragHandleProps}
                              >
                                <TodoText>{todo.text}</TodoText>
                                <TodoActions>
                                  <ActionButton onClick={() => {
                                    if (window.confirm('Are you sure you want to delete this task?')) {
                                      deleteTodo(todo.id);
                                    }
                                  }}>×</ActionButton>
                                </TodoActions>
                              </TodoItem>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </TodoList>
                    </Column>
                  )}
                </Droppable>
              ))}
            </ColumnsRow>
          </DragDropContext>
        </Board>
      </CenteredContainer>
    </AppBackground>
  );
};

export default App; 