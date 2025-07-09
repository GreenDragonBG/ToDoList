import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Header from './components/Header';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult
} from "@hello-pangea/dnd";
import supabase from './data/supabase';
import { UserProvider, useUser } from './contexts/UserContext';
import LoginRegister from './components/LoginRegister';

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
  order?: number; // Added order field
}

const getColumnTasks = (tasks: Todo[], status: 'todo' | 'doing' | 'done') =>
  tasks
    .filter(t => t.status === status)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

const AppContent: React.FC = () => {
  const { user, logout, deleteProfile } = useUser();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    if (!user) return;
    // Fetch tasks from Supabase on load for current user
    const fetchTasks = async () => {
      const { data, error } = await supabase.from('Tasks').select().eq('userId', user.id);
      if (error) {
        alert('Failed to fetch tasks from database');
        return;
      }
      if (data) {
        setTodos(
          data.map((task: any) => ({
            id: task.id.toString(),
            text: task.Description,
            status:
              task.Space === 'To Be Done'
                ? 'todo'
                : task.Space === 'Is Being Done'
                ? 'doing'
                : 'done',
            order: task.order, // Ensure order is fetched
          }))
        );
      }
    };
    fetchTasks();
  }, [user]);

  const handleAddTask = async (text: string) => {
    if (!text.trim() || !user) return;
    // Find max order in 'To Be Done' column
    const maxOrder = Math.max(0, ...todos.filter(t => t.status === 'todo').map(t => t.order ?? 0));
    // Insert into Supabase with userId and order
    const { data, error } = await supabase
      .from('Tasks')
      .insert([{ Description: text.trim(), Space: 'To Be Done', userId: user.id, order: maxOrder + 1 }])
      .select();
    if (error) {
      alert('Failed to add task to database');
      return;
    }
    const newTask = data && data[0];
    if (newTask) {
      setTodos(prev => [
        ...prev,
        { id: newTask.id.toString(), text: newTask.Description, status: 'todo', order: newTask.order },
      ]);
    }
  };

  const deleteTodo = async (id: string) => {
    if (!user) return;
    // Remove from Supabase for current user
    const { error } = await supabase
      .from('Tasks')
      .delete()
      .eq('id', id)
      .eq('userId', user.id);
    if (error) {
      alert('Failed to delete task from database');
      return;
    }
    setTodos(prev => prev.filter(todo => todo.id !== id));
  };

  const moveTodo = async (id: string, newStatus: 'todo' | 'doing' | 'done') => {
    if (!user) return;
    // Update in Supabase for current user
    let newSpace =
      newStatus === 'todo'
        ? 'To Be Done'
        : newStatus === 'doing'
        ? 'Is Being Done'
        : 'Is Done';
    const { error } = await supabase
      .from('Tasks')
      .update({ Space: newSpace })
      .eq('id', id)
      .eq('userId', user.id);
    if (error) {
      alert('Failed to update task status in database');
      return;
    }
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
    if (!user) return;
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    const newStatus = destination.droppableId as 'todo' | 'doing' | 'done';

    // Get tasks in source and destination columns
    const sourceTasks = getColumnTasks(todos, source.droppableId as Todo['status']);
    const destTasks = getColumnTasks(todos, destination.droppableId as Todo['status']);

    // Find the task being moved
    const movingTask = todos.find(t => t.id === draggableId);
    if (!movingTask) return;

    let newTodos = [...todos];

    // Remove from source
    if (source.droppableId === destination.droppableId) {
      // Reorder within the same column
      const reordered = Array.from(sourceTasks);
      const [removed] = reordered.splice(source.index, 1);
      reordered.splice(destination.index, 0, removed);
      // Update order
      reordered.forEach((task, idx) => {
        newTodos = newTodos.map(t => t.id === task.id ? { ...t, order: idx + 1 } : t);
      });
    } else {
      // Remove from source
      const newSource = Array.from(sourceTasks);
      const [removed] = newSource.splice(source.index, 1);
      // Insert into destination
      const newDest = Array.from(destTasks);
      removed.status = newStatus;
      newDest.splice(destination.index, 0, removed);
      // Update order in source
      newSource.forEach((task, idx) => {
        newTodos = newTodos.map(t => t.id === task.id ? { ...t, order: idx + 1 } : t);
      });
      // Update order in destination
      newDest.forEach((task, idx) => {
        newTodos = newTodos.map(t => t.id === task.id ? { ...t, status: newStatus, order: idx + 1 } : t);
      });
    }

    setTodos(newTodos);

    // Update the database asynchronously
    const updates = newTodos
      .filter(t => t.status === newStatus)
      .map(t =>
        supabase
          .from('Tasks')
          .update({ Space: t.status === 'todo' ? 'To Be Done' : t.status === 'doing' ? 'Is Being Done' : 'Is Done', order: t.order })
          .eq('id', t.id)
          .eq('userId', user.id)
      );
    Promise.all(updates);
  };

  if (!user) return <LoginRegister />;

  return (
    <AppBackground>
      <Header onAddTask={handleAddTask} />
      <button onClick={logout} style={{ position: 'fixed', top: 20, right: 20, zIndex: 2000, background: '#232a36', color: '#e6e6e6', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}>Logout</button>
      <button
        onClick={async () => {
          const username = prompt('Type your username to confirm:');
          const password = prompt('Type your password to confirm:');
          if (!username || !password) return;
          if (username !== user.username) {
            alert('Username does not match.');
            return;
          }
          // Check password
          const { data, error } = await supabase
            .from('Users')
            .select('id')
            .eq('id', user.id)
            .eq('password', password)
            .single();
          if (error || !data) {
            alert('Password is incorrect.');
            return;
          }
          if (window.confirm('Are you sure you want to delete your profile? This will remove your account and all your tasks.')) {
            const ok = await deleteProfile();
            if (!ok) alert('Failed to delete profile.');
          }
        }}
        style={{ position: 'fixed', top: 60, right: 20, zIndex: 2000, background: '#e06c75', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}
      >
        Delete Profile
      </button>
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

const App: React.FC = () => (
  <UserProvider>
    <AppContent />
  </UserProvider>
);

export default App; 