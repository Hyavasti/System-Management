using System;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using System.Windows.Shapes;
using ComputerShopManagement.Models;

namespace ComputerShopManagement.Controls
{
    public partial class CircularProgressBar : UserControl
    {
        public static readonly DependencyProperty ProgressProperty =
            DependencyProperty.Register("Progress", typeof(double), typeof(CircularProgressBar),
                new PropertyMetadata(0.0, OnProgressChanged));

        public static readonly DependencyProperty StatusProperty =
            DependencyProperty.Register("Status", typeof(SessionStatus), typeof(CircularProgressBar),
                new PropertyMetadata(SessionStatus.Active, OnStatusChanged));

        public double Progress
        {
            get { return (double)GetValue(ProgressProperty); }
            set { SetValue(ProgressProperty, value); }
        }

        public SessionStatus Status
        {
            get { return (SessionStatus)GetValue(StatusProperty); }
            set { SetValue(StatusProperty, value); }
        }

        public CircularProgressBar()
        {
            InitializeComponent();
            UpdateProgress();
        }

        private static void OnProgressChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
        {
            ((CircularProgressBar)d).UpdateProgress();
        }

        private static void OnStatusChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
        {
            ((CircularProgressBar)d).UpdateProgress();
        }

        private void UpdateProgress()
        {
            double radius = 96;
            double centerX = 100;
            double centerY = 100;
            double angle = Progress * 360;

            if (angle >= 360) angle = 359.99;

            double startAngle = -90;
            double endAngle = startAngle + angle;

            Point startPoint = new Point(
                centerX + radius * Math.Cos(startAngle * Math.PI / 180),
                centerY + radius * Math.Sin(startAngle * Math.PI / 180)
            );

            Point endPoint = new Point(
                centerX + radius * Math.Cos(endAngle * Math.PI / 180),
                centerY + radius * Math.Sin(endAngle * Math.PI / 180)
            );

            bool largeArc = angle > 180;

            PathGeometry geometry = new PathGeometry();
            PathFigure figure = new PathFigure { StartPoint = startPoint };
            
            ArcSegment arc = new ArcSegment
            {
                Point = endPoint,
                Size = new Size(radius, radius),
                SweepDirection = SweepDirection.Clockwise,
                IsLargeArc = largeArc
            };

            figure.Segments.Add(arc);
            geometry.Figures.Add(figure);

            ProgressPath.Data = geometry;

            // Set colors based on status and progress
            if (Status == SessionStatus.Offline)
            {
                ProgressPath.Stroke = new SolidColorBrush((Color)FindResource("OfflineGray"));
            }
            else if (Status == SessionStatus.OrderPending)
            {
                ProgressPath.Stroke = new SolidColorBrush((Color)FindResource("WarningYellow"));
            }
            else
            {
                // Gradient from blue to green for active sessions
                LinearGradientBrush brush = new LinearGradientBrush();
                brush.StartPoint = new Point(0, 0);
                brush.EndPoint = new Point(1, 1);
                brush.GradientStops.Add(new GradientStop((Color)FindResource("ActiveBlue"), 0.0));
                brush.GradientStops.Add(new GradientStop((Color)FindResource("ActiveGreen"), Progress));
                ProgressPath.Stroke = brush;
            }
        }
    }
}
