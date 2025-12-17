using System;
using System.Collections.ObjectModel;
using System.Windows.Input;
using ComputerShopManagement.Models;

namespace ComputerShopManagement.ViewModels
{
    public class DashboardViewModel
    {
        public ObservableCollection<PcSession> PcSessions { get; set; }
        
        public ICommand Add30MinutesCommand { get; }
        public ICommand Add1HourCommand { get; }
        public ICommand EndSessionCommand { get; }

        public DashboardViewModel()
        {
            PcSessions = new ObservableCollection<PcSession>
            {
                new PcSession 
                { 
                    PcName = "PC-05", 
                    UserName = "Tarnnky", 
                    TimeRemaining = new TimeSpan(1, 25, 0), 
                    Status = SessionStatus.Active,
                    Progress = 0.65
                },
                new PcSession 
                { 
                    PcName = "PC-12", 
                    UserName = "Samaha", 
                    TimeRemaining = new TimeSpan(1, 25, 0), 
                    Status = SessionStatus.Active,
                    Progress = 0.85
                },
                new PcSession 
                { 
                    PcName = "PC-12", 
                    UserName = "Maniona", 
                    TimeRemaining = TimeSpan.Zero, 
                    Status = SessionStatus.Offline,
                    Progress = 0
                },
                new PcSession 
                { 
                    PcName = "PC-03", 
                    UserName = "Stebborn", 
                    TimeRemaining = new TimeSpan(1, 20, 0), 
                    Status = SessionStatus.Active,
                    Progress = 0.95
                },
                new PcSession 
                { 
                    PcName = "PC-08", 
                    UserName = "Mornny", 
                    TimeRemaining = new TimeSpan(2, 20, 0), 
                    Status = SessionStatus.Active,
                    Progress = 0.50
                },
                new PcSession 
                { 
                    PcName = "PC-12", 
                    UserName = "Stephen", 
                    TimeRemaining = new TimeSpan(2, 20, 0), 
                    Status = SessionStatus.Active,
                    Progress = 0.75
                },
                new PcSession 
                { 
                    PcName = "PC-08", 
                    UserName = "Rlinhy", 
                    TimeRemaining = new TimeSpan(0, 5, 0), 
                    Status = SessionStatus.OrderPending,
                    Progress = 0.98
                },
                new PcSession 
                { 
                    PcName = "PC-04", 
                    UserName = "Bnothan", 
                    TimeRemaining = new TimeSpan(2, 10, 0), 
                    Status = SessionStatus.Active,
                    Progress = 0.70
                }
            };
            
            Add30MinutesCommand = new RelayCommand<PcSession>(session => AddTime(session, 30));
            Add1HourCommand = new RelayCommand<PcSession>(session => AddTime(session, 60));
            EndSessionCommand = new RelayCommand<PcSession>(EndSession);
        }
        
        private void AddTime(PcSession session, int minutes)
        {
            if (session == null || session.Status == SessionStatus.Offline) return;
            
            session.TimeRemaining = session.TimeRemaining.Add(new TimeSpan(0, minutes, 0));
            
            // Recalculate progress if needed (optional)
            // You can add logic here to adjust the progress bar
        }
        
        private void EndSession(PcSession session)
        {
            if (session == null) return;
            
            session.Status = SessionStatus.Offline;
            session.TimeRemaining = TimeSpan.Zero;
            session.Progress = 0;
        }
    }
    
    public class RelayCommand<T> : ICommand
    {
        private readonly Action<T> _execute;
        private readonly Predicate<T> _canExecute;

        public RelayCommand(Action<T> execute, Predicate<T> canExecute = null)
        {
            _execute = execute ?? throw new ArgumentNullException(nameof(execute));
            _canExecute = canExecute;
        }

        public bool CanExecute(object parameter)
        {
            return _canExecute == null || _canExecute((T)parameter);
        }

        public void Execute(object parameter)
        {
            _execute((T)parameter);
        }

        public event EventHandler CanExecuteChanged
        {
            add { CommandManager.RequerySuggested += value; }
            remove { CommandManager.RequerySuggested -= value; }
        }
    }
}
